// IMPORTANT: Polyfill must be imported FIRST
import '../polyfills';

import { Context, HttpRequest } from '@azure/functions';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { getTableClient, TABLES, entityToObject } from '../services/tableStorage';
import { UserEntity } from '../types';

// Supabase URL for JWKS endpoint
const supabaseUrl = process.env.SUPABASE_URL || '';
// Legacy JWT secret for HS256 fallback
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET || '';

// Create JWKS client to fetch signing keys from Supabase
const client = supabaseUrl
  ? jwksClient({
      jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
      rateLimit: true,
    })
  : null;

// Log configuration status
console.log('[Auth] JWKS config check:', {
  hasSupabaseUrl: !!supabaseUrl,
  jwksUri: supabaseUrl ? `${supabaseUrl}/auth/v1/.well-known/jwks.json` : 'not configured',
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

interface SupabaseJwtPayload {
  sub: string;  // user id
  email?: string;
  role?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

// Function to get signing key from JWKS
function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
  if (!client) {
    callback(new Error('JWKS client not configured'));
    return;
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Promisified JWT verification using JWKS
function verifyTokenWithJwks(token: string): Promise<SupabaseJwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ['ES256', 'RS256'] }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as SupabaseJwtPayload);
      }
    });
  });
}

export async function verifyAuth(
  request: HttpRequest,
  context: Context
): Promise<AuthResult> {
  // Azure SWA replaces the Authorization header with its own internal token.
  // We use X-Supabase-Auth custom header to pass the actual Supabase token.
  const supabaseToken = request.headers['x-supabase-auth'];

  // Fallback to Authorization header for local development or direct API access
  const authHeader = request.headers['authorization'] || request.headers['Authorization'];

  context.log('[Auth] X-Supabase-Auth present:', !!supabaseToken);
  context.log('[Auth] Authorization header present:', !!authHeader);

  // Prefer X-Supabase-Auth, fall back to Authorization header
  let token: string | undefined;

  if (supabaseToken) {
    token = supabaseToken;
  } else if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return {
      success: false,
      error: 'Missing authentication token. Provide X-Supabase-Auth header or Authorization Bearer token.',
      status: 401,
    };
  }

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

  if (!client) {
    context.log.warn('SUPABASE_URL not configured. Using mock authentication.');
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
    // Decode token header to see the algorithm
    // JWT uses base64url encoding, so we need to convert to standard base64
    const tokenParts = token.split('.');
    const base64UrlHeader = tokenParts[0];
    context.log('[Auth] Raw token header (first 50 chars):', base64UrlHeader.substring(0, 50));
    const base64Header = base64UrlHeader.replace(/-/g, '+').replace(/_/g, '/');
    const decodedString = Buffer.from(base64Header, 'base64').toString();
    context.log('[Auth] Decoded header string:', decodedString);
    const header = JSON.parse(decodedString);
    context.log('[Auth] Parsed token header:', { alg: header.alg, kid: header.kid, typ: header.typ });

    let decoded: SupabaseJwtPayload;

    // If token uses HS256 (legacy), verify with JWT secret
    if (header.alg === 'HS256') {
      context.log('[Auth] Token uses HS256, verifying with JWT secret...');
      if (!supabaseJwtSecret) {
        return {
          success: false,
          error: 'HS256 token received but SUPABASE_JWT_SECRET not configured',
          status: 401,
        };
      }
      decoded = jwt.verify(token, supabaseJwtSecret, { algorithms: ['HS256'] }) as SupabaseJwtPayload;
    } else {
      // For ES256/RS256, use JWKS verification
      context.log('[Auth] Token uses asymmetric algorithm, verifying with JWKS...');
      decoded = await verifyTokenWithJwks(token);
    }

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
