import { HttpRequest, InvocationContext } from '@azure/functions';
import { createClient } from '@supabase/supabase-js';
import { getTableClient, TABLES, entityToObject } from '../services/tableStorage';
import { User, UserEntity } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

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
  context: InvocationContext
): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');

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

  if (!supabase) {
    context.warn('Supabase not configured. Using mock authentication.');
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
    // Verify the JWT token with Supabase
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      return {
        success: false,
        error: 'Invalid or expired token',
        status: 401,
      };
    }

    // Fetch user profile from Table Storage
    try {
      const usersTable = getTableClient(TABLES.USERS);
      const userEntity = await usersTable.getEntity<UserEntity>('user', supabaseUser.id);
      const userProfile = entityToObject<UserEntity>(userEntity);

      return {
        success: true,
        user: {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role: userProfile.role,
          centerId: userProfile.centerId || null,
          centerName: userProfile.centerName || null,
          displayName: userProfile.displayName,
        },
      };
    } catch (profileError) {
      // If profile doesn't exist, create default admin profile
      context.warn('User profile not found in Table Storage, using default');
      return {
        success: true,
        user: {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role: 'admin',
          centerId: null,
          centerName: null,
          displayName: supabaseUser.email?.split('@')[0] || 'User',
        },
      };
    }
  } catch (error) {
    context.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      status: 500,
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
