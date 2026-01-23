import { ClockIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

export function PendingApprovalMessage() {
  const { signOut, oauthStatus } = useAuth();

  const isRejected = oauthStatus === 'rejected';

  return (
    <div className="w-full text-center">
      <div className={`w-16 h-16 ${isRejected ? 'bg-red-50' : 'bg-warning-light'} rounded-full flex items-center justify-center mx-auto mb-6`}>
        <ClockIcon className={`w-8 h-8 ${isRejected ? 'text-red-500' : 'text-warning'}`} />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-3">
        {isRejected ? 'Registration Rejected' : 'Pending Approval'}
      </h2>
      <p className="text-text-secondary mb-6">
        {isRejected
          ? 'Your registration request was not approved. Please contact your administrator for more information.'
          : 'Your Google account has been registered. An administrator will review your request and link it to a student profile.'}
      </p>
      {!isRejected && (
        <p className="text-text-secondary text-sm mb-8">
          You'll be able to sign in once your account is approved.
        </p>
      )}
      <button
        onClick={signOut}
        className="text-primary font-medium hover:underline"
      >
        Sign out
      </button>
    </div>
  );
}
