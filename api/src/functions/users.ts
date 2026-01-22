// IMPORTANT: Polyfill must be imported FIRST
import '../polyfills';

import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { verifyAuth } from '../middleware/auth';
import { getTableClient, TABLES, entityToObject } from '../services/tableStorage';
import { User, UserEntity, ApiResponse, CenterEntity } from '../types';

// GET /api/users/me - Get current user profile
export const getCurrentUser: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;

  try {
    const usersTable = getTableClient(TABLES.USERS);

    // Get user from table
    const entity = await usersTable.getEntity<UserEntity>('user', user.id);
    const userEntity = entityToObject<UserEntity>(entity);

    // Get center name if user has a center
    let centerName: string | null = null;
    if (userEntity.centerId) {
      try {
        const centersTable = getTableClient(TABLES.CENTERS);
        const center = await centersTable.getEntity<CenterEntity>('center', userEntity.centerId);
        centerName = center.name;
      } catch {
        centerName = null;
      }
    }

    const userData: User = {
      id: userEntity.rowKey,
      email: userEntity.email,
      displayName: userEntity.displayName,
      role: userEntity.role,
      centerId: userEntity.centerId || null,
      centerName: centerName,
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
    };

    const response: ApiResponse<User> = {
      success: true,
      data: userData,
    };

    context.res = { status: 200, body: response };
  } catch (error: unknown) {
    // If user not found in table, return the auth user data
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      const userData: User = {
        id: user.id,
        email: user.email || '',
        displayName: user.displayName || '',
        role: user.role,
        centerId: user.centerId || null,
        centerName: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      context.res = { status: 200, body: { success: true, data: userData } };
      return;
    }

    context.log.error('Error fetching user:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch user profile' } };
  }
};

// PUT /api/users/me - Update current user profile
export const updateCurrentUser: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;

  try {
    const body = req.body as { displayName?: string };
    const usersTable = getTableClient(TABLES.USERS);

    // Get existing user
    let entity: UserEntity;
    try {
      const existingEntity = await usersTable.getEntity<UserEntity>('user', user.id);
      entity = entityToObject<UserEntity>(existingEntity);
    } catch {
      // Create new user entity if not exists
      entity = {
        partitionKey: 'user',
        rowKey: user.id,
        email: user.email || '',
        displayName: user.displayName || '',
        role: user.role,
        centerId: user.centerId || '',
        centerName: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Update fields
    const updatedEntity: UserEntity = {
      ...entity,
      partitionKey: 'user',
      rowKey: user.id,
      ...(body.displayName && { displayName: body.displayName }),
      updatedAt: new Date().toISOString(),
    };

    await usersTable.upsertEntity(updatedEntity, 'Replace');

    // Get center name if user has a center
    let centerName: string | null = null;
    if (updatedEntity.centerId) {
      try {
        const centersTable = getTableClient(TABLES.CENTERS);
        const center = await centersTable.getEntity<CenterEntity>('center', updatedEntity.centerId);
        centerName = center.name;
      } catch {
        centerName = null;
      }
    }

    const userData: User = {
      id: updatedEntity.rowKey,
      email: updatedEntity.email,
      displayName: updatedEntity.displayName,
      role: updatedEntity.role,
      centerId: updatedEntity.centerId || null,
      centerName: centerName,
      createdAt: updatedEntity.createdAt,
      updatedAt: updatedEntity.updatedAt,
    };

    const response: ApiResponse<User> = {
      success: true,
      data: userData,
    };

    context.res = { status: 200, body: response };
  } catch (error) {
    context.log.error('Error updating user:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to update user profile' } };
  }
};
