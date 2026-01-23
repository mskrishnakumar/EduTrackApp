import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginHero } from '../components/auth/LoginHero';
import { LoginForm } from '../components/auth/LoginForm';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';
import { PendingApprovalMessage } from '../components/auth/PendingApprovalMessage';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';

export function LoginPage() {
  const { user, loading, oauthStatus } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'admin' | 'student'>('admin');

  // Redirect if already logged in (role-based)
  useEffect(() => {
    if (user && !loading) {
      const destination = user.role === 'student' ? ROUTES.STUDENT_DASHBOARD : ROUTES.DASHBOARD;
      navigate(destination);
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

  // Show pending/rejected status for OAuth users
  const showPendingMessage = oauthStatus === 'pending_approval' || oauthStatus === 'rejected';

  return (
    <div className="min-h-screen flex bg-white">
      {/* Hero Section - Hidden on mobile */}
      <LoginHero />

      {/* Login Form Section - Fixed width on desktop */}
      <div className="flex-1 lg:flex-none lg:w-[480px] flex flex-col justify-center px-12 py-16">
        {showPendingMessage ? (
          <PendingApprovalMessage />
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="mb-8">
              <div className="flex rounded-input bg-gray-bg p-1">
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex-1 py-2.5 px-4 text-body font-medium rounded-badge transition-all ${
                    activeTab === 'admin'
                      ? 'bg-white text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => setActiveTab('student')}
                  className={`flex-1 py-2.5 px-4 text-body font-medium rounded-badge transition-all ${
                    activeTab === 'student'
                      ? 'bg-white text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Student
                </button>
              </div>
            </div>

            {/* Content based on tab */}
            {activeTab === 'admin' ? <LoginForm /> : <GoogleLoginButton />}
          </>
        )}
      </div>
    </div>
  );
}
