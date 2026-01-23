// IMPORTANT: Polyfill must be imported FIRST
import '../polyfills';

import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { verifyAuth } from '../middleware/auth';
import { getTableClient, TABLES, entityToObject } from '../services/tableStorage';
import { UserEntity, StudentEntity, RegistrationEntity } from '../types';

interface OAuthResolveResponse {
  status: 'active' | 'pending_approval' | 'rejected';
  role?: string;
  studentId?: string;
  displayName?: string;
  autoLinked?: boolean;
  registrationId?: string;
}

// POST /api/auth/oauth-resolve
// Called after Google OAuth sign-in to resolve the user's role and student linkage
export const resolveOAuthUser: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const authResult = await verifyAuth(req, context);
  if (!authResult.success) {
    context.res = { status: authResult.status, body: { success: false, error: authResult.error } };
    return;
  }

  const user = authResult.user!;
  const email = user.email;

  if (!email) {
    context.res = { status: 400, body: { success: false, error: 'No email found in token' } };
    return;
  }

  // Step 1: Check if user already exists in Users table with a profile
  try {
    const usersTable = getTableClient(TABLES.USERS);
    const existingEntity = await usersTable.getEntity<UserEntity>('user', user.id);
    const existingUser = entityToObject<UserEntity>(existingEntity);

    // User already has a profile - return active status
    context.res = {
      status: 200,
      body: {
        success: true,
        data: {
          status: 'active',
          role: existingUser.role,
          studentId: existingUser.studentId || null,
          displayName: existingUser.displayName,
        } as OAuthResolveResponse,
      },
    };
    return;
  } catch (error: unknown) {
    // 404 means user not found - continue to matching logic
    if (!error || typeof error !== 'object' || !('statusCode' in error) || error.statusCode !== 404) {
      context.log.error('Error checking user profile:', error);
      context.res = { status: 500, body: { success: false, error: 'Failed to check user profile' } };
      return;
    }
  }

  // Step 2: Check if there's an existing pending/rejected registration
  try {
    const registrationsTable = getTableClient(TABLES.REGISTRATIONS);
    const iterator = registrationsTable.listEntities<RegistrationEntity>({
      queryOptions: { filter: `email eq '${email}'` },
    });

    for await (const entity of iterator) {
      const reg = entityToObject<RegistrationEntity>(entity);
      if (reg.status === 'pending') {
        context.res = {
          status: 200,
          body: { success: true, data: { status: 'pending_approval' } as OAuthResolveResponse },
        };
        return;
      }
      if (reg.status === 'rejected') {
        context.res = {
          status: 200,
          body: { success: true, data: { status: 'rejected' } as OAuthResolveResponse },
        };
        return;
      }
      // If approved, fall through to create user profile
    }
  } catch (error) {
    context.log.warn('Error checking registrations:', error);
    // Continue to student matching
  }

  // Step 3: Try to match email against student records
  try {
    const studentsTable = getTableClient(TABLES.STUDENTS);
    let matchedStudent: StudentEntity | null = null;

    const iterator = studentsTable.listEntities<StudentEntity>({
      queryOptions: { filter: `email eq '${email}' and isActive eq true` },
    });

    for await (const entity of iterator) {
      matchedStudent = entityToObject<StudentEntity>(entity);
      break; // Take the first match
    }

    if (matchedStudent) {
      // Auto-link: Create user profile with student role
      const usersTable = getTableClient(TABLES.USERS);
      const newUser: UserEntity = {
        partitionKey: 'user',
        rowKey: user.id,
        email: email,
        displayName: matchedStudent.name,
        role: 'student',
        centerId: matchedStudent.partitionKey || '',
        centerName: '',
        studentId: matchedStudent.rowKey,
        authProvider: 'google',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await usersTable.upsertEntity(newUser);

      context.res = {
        status: 200,
        body: {
          success: true,
          data: {
            status: 'active',
            role: 'student',
            studentId: matchedStudent.rowKey,
            displayName: matchedStudent.name,
            autoLinked: true,
          } as OAuthResolveResponse,
        },
      };
      return;
    }
  } catch (error) {
    context.log.warn('Error matching student records:', error);
  }

  // Step 4: No match - create pending registration
  try {
    const registrationsTable = getTableClient(TABLES.REGISTRATIONS);
    const regId = uuidv4();
    const newRegistration: RegistrationEntity = {
      partitionKey: 'registration',
      rowKey: regId,
      email: email,
      displayName: user.displayName || email.split('@')[0],
      googleUserId: user.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await registrationsTable.upsertEntity(newRegistration);

    context.res = {
      status: 200,
      body: {
        success: true,
        data: { status: 'pending_approval', registrationId: regId } as OAuthResolveResponse,
      },
    };
  } catch (error) {
    context.log.error('Error creating registration:', error);
    context.res = { status: 500, body: { success: false, error: 'Failed to create registration' } };
  }
};
