import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { User, OAuthResolveStatus, OAuthResolveResponse } from '../types';
import { api } from '../services/api';
import { setAuthToken } from '../services/dataService';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  oauthStatus: OAuthResolveStatus | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development when Supabase is not configured
const MOCK_USER: User = {
  id: 'mock-user-id',
  email: 'admin@edutrack.com',
  displayName: 'Admin User',
  role: 'admin',
  centerId: null,
  centerName: null,
  studentId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock student user for development
const MOCK_STUDENT_USER: User = {
  id: 'mock-student-user-id',
  email: 'student@edutrack.com',
  displayName: 'Alex Johnson',
  role: 'student',
  centerId: 'center-1',
  centerName: 'Downtown Learning Center',
  studentId: 'stu-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [oauthStatus, setOauthStatus] = useState<OAuthResolveStatus | null>(null);

  const resolveOAuthUser = useCallback(async (userId: string, email: string, token: string, displayName?: string) => {
    try {
      const response = await api.post<OAuthResolveResponse>('/auth/oauth-resolve', {}, token);
      if (response.success && response.data) {
        if (response.data.status === 'active') {
          setUser({
            id: userId,
            email: email,
            displayName: response.data.displayName || displayName || email.split('@')[0],
            role: 'student',
            centerId: null,
            centerName: null,
            studentId: response.data.studentId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setOauthStatus('active');
        } else {
          setOauthStatus(response.data.status);
          setUser(null);
        }
      } else {
        setOauthStatus('pending_approval');
        setUser(null);
      }
    } catch (error) {
      console.error('Error resolving OAuth user:', error);
      setOauthStatus('pending_approval');
      setUser(null);
    }
  }, []);

  const loadUserProfile = useCallback(async (userId: string, email: string, token: string, isGoogleUser?: boolean, googleDisplayName?: string) => {
    if (isGoogleUser) {
      await resolveOAuthUser(userId, email, token, googleDisplayName);
      return;
    }

    try {
      const response = await api.get<User>('/users/me', token);
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // API returned but no data, create fallback user
        setUser({
          id: userId,
          email: email,
          displayName: email.split('@')[0],
          role: 'admin',
          centerId: null,
          centerName: null,
          studentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // If API is not available, create user from Supabase data
      setUser({
        id: userId,
        email: email,
        displayName: email.split('@')[0],
        role: 'admin',
        centerId: null,
        centerName: null,
        studentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [resolveOAuthUser]);

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      // Development mode without Supabase - auto-login with mock user
      console.warn('Supabase not configured. Using mock authentication.');
      setLoading(false);
      return;
    }

    // Get initial session - onAuthStateChange INITIAL_SESSION will handle profile loading
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      setAuthToken(session?.access_token ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        setAuthToken(session?.access_token ?? null);

        // Skip profile reload on token refreshes - only load on meaningful events
        if (event === 'TOKEN_REFRESHED') {
          return;
        }

        if (session?.user && session?.access_token) {
          const isGoogle = session.user.app_metadata?.provider === 'google'
            || session.user.app_metadata?.providers?.includes('google');
          const googleName = session.user.user_metadata?.full_name;
          await loadUserProfile(session.user.id, session.user.email || '', session.access_token, isGoogle, googleName);
        } else {
          setUser(null);
          setOauthStatus(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  const signIn = async (email: string, password: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      // Development mode - mock sign in (admin only)
      setUser(MOCK_USER);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      // Development mode - mock Google sign in as student
      setUser(MOCK_STUDENT_USER);
      setOauthStatus('active');
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      setUser(null);
      setOauthStatus(null);
      setAuthToken(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
    setOauthStatus(null);
    setAuthToken(null);
  };

  const getToken = async (): Promise<string | null> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      // Development mode - return mock token
      return 'mock-token';
    }

    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        loading,
        oauthStatus,
        signIn,
        signInWithGoogle,
        signOut,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
