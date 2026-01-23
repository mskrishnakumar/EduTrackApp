import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';

export function AuthCallbackPage() {
  const { user, loading, oauthStatus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (user) {
      const destination = user.role === 'student'
        ? ROUTES.STUDENT_DASHBOARD
        : ROUTES.DASHBOARD;
      navigate(destination, { replace: true });
    } else if (oauthStatus === 'pending_approval' || oauthStatus === 'rejected') {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [user, loading, oauthStatus, navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-body">Completing sign-in...</p>
      </div>
    </div>
  );
}
