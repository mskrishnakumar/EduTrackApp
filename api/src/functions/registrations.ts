// IMPORTANT: Polyfill must be imported FIRST
import '../polyfills';

import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { verifyAuth } from '../middleware/auth';
import { getTableClient, TABLES, entityToObject } from '../services/tableStorage';
import { RegistrationEntity, UserEntity } from '../types';

// GET /api/registrations
export const getRegistrations: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  // Only admins/coordinators can view registrations
  if (authResult.user!.role === 'student') {
    context.res = { status: 403, body: { success: false, error: 'Forbidden' } };
    return;
  }

  try {
    const registrationsTable = getTableClient(TABLES.REGISTRATIONS);
    const registrations: RegistrationEntity[] = [];

    const iterator = registrationsTable.listEntities<RegistrationEntity>();
    for await (const entity of iterator) {
      registrations.push(entityToObject<RegistrationEntity>(entity));
    }

    // Map to frontend format
    const data = registrations.map(r => ({
      id: r.rowKey,
      email: r.email,
      displayName: r.displayName,
      status: r.status,
      studentId: r.studentId || undefined,
      createdAt: r.createdAt,
    }));

    context.res = { status: 200, body: { success: true, data } };
  } catch (error) {
    context.log.error('Error fetching registrations:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch registrations' } };
  }
};

// PUT /api/registrations/{id}/approve
export const approveRegistration: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  if (authResult.user!.role === 'student') {
    context.res = { status: 403, body: { success: false, error: 'Forbidden' } };
    return;
  }

  const registrationId = context.bindingData.id;
  const { studentId } = req.body || {};

  if (!studentId) {
    context.res = { status: 400, body: { success: false, error: 'studentId is required' } };
    return;
  }

  try {
    const registrationsTable = getTableClient(TABLES.REGISTRATIONS);

    // Find the registration
    let registration: RegistrationEntity | null = null;
    try {
      const entity = await registrationsTable.getEntity<RegistrationEntity>('registration', registrationId);
      registration = entityToObject<RegistrationEntity>(entity);
    } catch {
      context.res = { status: 404, body: { success: false, error: 'Registration not found' } };
      return;
    }

    // Update registration status
    const { partitionKey: _pk, rowKey: _rk, ...regFields } = registration;
    await registrationsTable.upsertEntity({
      partitionKey: 'registration',
      rowKey: registrationId,
      ...regFields,
      status: 'approved',
      studentId,
      updatedAt: new Date().toISOString(),
    });

    // Create user profile for the Google OAuth user
    if (registration.googleUserId) {
      const usersTable = getTableClient(TABLES.USERS);
      const newUser: UserEntity = {
        partitionKey: 'user',
        rowKey: registration.googleUserId,
        email: registration.email,
        displayName: registration.displayName,
        role: 'student',
        centerId: '',
        centerName: '',
        studentId,
        authProvider: 'google',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await usersTable.upsertEntity(newUser);
    }

    context.res = {
      status: 200,
      body: {
        success: true,
        data: {
          id: registrationId,
          email: registration.email,
          displayName: registration.displayName,
          status: 'approved',
          studentId,
          createdAt: registration.createdAt,
        },
      },
    };
  } catch (error) {
    context.log.error('Error approving registration:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to approve registration' } };
  }
};

// PUT /api/registrations/{id}/reject
export const rejectRegistration: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  if (authResult.user!.role === 'student') {
    context.res = { status: 403, body: { success: false, error: 'Forbidden' } };
    return;
  }

  const registrationId = context.bindingData.id;

  try {
    const registrationsTable = getTableClient(TABLES.REGISTRATIONS);

    let registration: RegistrationEntity | null = null;
    try {
      const entity = await registrationsTable.getEntity<RegistrationEntity>('registration', registrationId);
      registration = entityToObject<RegistrationEntity>(entity);
    } catch {
      context.res = { status: 404, body: { success: false, error: 'Registration not found' } };
      return;
    }

    const { partitionKey: _pk2, rowKey: _rk2, ...rejFields } = registration!;
    await registrationsTable.upsertEntity({
      partitionKey: 'registration',
      rowKey: registrationId,
      ...rejFields,
      status: 'rejected',
      updatedAt: new Date().toISOString(),
    });

    context.res = {
      status: 200,
      body: {
        success: true,
        data: {
          id: registrationId,
          email: registration.email,
          displayName: registration.displayName,
          status: 'rejected',
          createdAt: registration.createdAt,
        },
      },
    };
  } catch (error) {
    context.log.error('Error rejecting registration:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to reject registration' } };
  }
};
