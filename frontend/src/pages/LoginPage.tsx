import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginHero } from '../components/auth/LoginHero';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';

export function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Hero Section - Hidden on mobile */}
      <LoginHero />

      {/* Login Form Section - Fixed width on desktop */}
      <div className="flex-1 lg:flex-none lg:w-[480px] flex flex-col justify-center px-12 py-16">
        <LoginForm />
      </div>
    </div>
  );
}
