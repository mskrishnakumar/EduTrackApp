import { Context, HttpRequest } from '@azure/functions';
import * as jwt from 'jsonwebtoken';
import { getTableClient, TABLES, entityToObject } from '../services/tableStorage';
import { UserEntity } from '../types';

// Supabase JWT Secret - found in Supabase Dashboard > Settings > API > JWT Settings
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET || '';

// Log configuration status (not the actual values for security)
console.log('[Auth] JWT config check:', {
  hasJwtSecret: !!supabaseJwtSecret,
  jwtSecretLength: supabaseJwtSecret.length,
});

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'coordinator';
  centerId: string | null;
  centerName: string | null;
  displayName: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  status?: number;
}

export async function verifyAuth(
  request: HttpRequest,
  context: Context
): Promise<AuthResult> {
  const authHeader = request.headers['authorization'] || request.headers['Authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid authorization header',
      status: 401,
    };
  }

  const token = authHeader.split(' ')[1];

  // Development mode - accept mock token
  if (token === 'mock-token') {
    return {
      success: true,
      user: {
        id: 'mock-user-id',
        email: 'admin@edutrack.com',
        role: 'admin',
        centerId: null,
        centerName: null,
        displayName: 'Mock Admin',
      },
    };
  }

  if (!supabaseJwtSecret) {
    context.log.warn('SUPABASE_JWT_SECRET not configured. Using mock authentication.');
    return {
      success: true,
      user: {
        id: 'mock-user-id',
        email: 'admin@edutrack.com',
        role: 'admin',
        centerId: null,
        centerName: null,
        displayName: 'Mock Admin',
      },
    };
  }

  try {
    // Verify the JWT token using the Supabase JWT secret
    context.log('[Auth] Verifying JWT token...');

    interface SupabaseJwtPayload {
      sub: string;  // user id
      email?: string;
      role?: string;
      aud?: string;
      exp?: number;
      iat?: number;
    }

    const decoded = jwt.verify(token, supabaseJwtSecret, {
      algorithms: ['HS256'],
    }) as SupabaseJwtPayload;

    if (!decoded.sub) {
      context.log.error('[Auth] Token missing sub (user id)');
      return {
        success: false,
        error: 'Invalid token: missing user id',
        status: 401,
      };
    }

    context.log('[Auth] Token verified successfully for user:', decoded.sub);

    // Fetch user profile from Table Storage
    try {
      const usersTable = getTableClient(TABLES.USERS);
      const userEntity = await usersTable.getEntity<UserEntity>('user', decoded.sub);
      const userProfile = entityToObject<UserEntity>(userEntity);

      return {
        success: true,
        user: {
          id: decoded.sub,
          email: decoded.email || '',
          role: userProfile.role,
          centerId: userProfile.centerId || null,
          centerName: userProfile.centerName || null,
          displayName: userProfile.displayName,
        },
      };
    } catch (profileError) {
      // If profile doesn't exist, create default admin profile
      context.log.warn('User profile not found in Table Storage, using default');
      return {
        success: true,
        user: {
          id: decoded.sub,
          email: decoded.email || '',
          role: 'admin',
          centerId: null,
          centerName: null,
          displayName: decoded.email?.split('@')[0] || 'User',
        },
      };
    }
  } catch (error) {
    const jwtError = error as jwt.JsonWebTokenError;
    context.log.error('[Auth] JWT verification failed:', {
      name: jwtError.name,
      message: jwtError.message,
    });
    return {
      success: false,
      error: `Invalid or expired token: ${jwtError.message}`,
      status: 401,
    };
  }
}

// Check if user has access to a specific center
export function checkCenterAccess(user: AuthenticatedUser, centerId: string): boolean {
  // Admins have access to all centers
  if (user.role === 'admin') {
    return true;
  }
  // Coordinators only have access to their assigned center
  return user.centerId === centerId;
}

// Get the center ID for queries (returns null for admins to get all)
export function getQueryCenterId(user: AuthenticatedUser): string | null {
  if (user.role === 'admin') {
    return null; // Admin sees all centers
  }
  return user.centerId; // Coordinator sees only their center
}
