import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { User } from '../types';
import { api } from '../services/api';
import { setAuthToken } from '../services/dataService';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development when Supabase is not configured
const MOCK_USER: User = {
  id: 'mock-user-id',
  email: 'admin@edutrack.com',
  displayName: 'Rahul Coordinator',
  role: 'admin',
  centerId: null,
  centerName: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (userId: string, token: string) => {
    try {
      const response = await api.get<User>('/users/me', token);
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // If API is not available yet, use mock data based on Supabase user
      setUser({
        ...MOCK_USER,
        id: userId,
      });
    }
  }, []);

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      // Development mode without Supabase - auto-login with mock user
      console.warn('Supabase not configured. Using mock authentication.');
      setLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      // Set auth token for API calls
      setAuthToken(session?.access_token ?? null);
      if (session?.user && session?.access_token) {
        loadUserProfile(session.user.id, session.access_token);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        // Set auth token for API calls
        setAuthToken(session?.access_token ?? null);
        if (session?.user && session?.access_token) {
          await loadUserProfile(session.user.id, session.access_token);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  const signIn = async (email: string, password: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      // Development mode - mock sign in
      setUser(MOCK_USER);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
      // Development mode - mock sign out
      setUser(null);
      setAuthToken(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
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
        signIn,
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
