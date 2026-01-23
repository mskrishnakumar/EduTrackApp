import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoginHero } from '../components/auth/LoginHero';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { ROUTES } from '../constants/routes';
import { dataService } from '../services/dataService';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const response = await dataService.registrations.create({
        displayName: fullName.trim(),
        email: email.trim(),
        password,
      });
      if (response.success) {
        setSubmitted(true);
      } else {
        setApiError(response.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex bg-white">
        <LoginHero />
        <div className="flex-1 lg:flex-none lg:w-[480px] flex flex-col justify-center px-12 py-16">
          <div className="w-full">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-text-primary mb-2 tracking-tight">
                Registration Submitted!
              </h2>
              <p className="text-text-secondary mt-4">
                Your account request has been submitted. An administrator will review
                your registration and link it to a student profile.
              </p>
              <p className="text-text-secondary mt-2">
                You will be able to log in once your account is approved.
              </p>
            </div>
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center text-primary font-medium hover:text-primary-dark hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      <LoginHero />
      <div className="flex-1 lg:flex-none lg:w-[480px] flex flex-col justify-center px-12 py-16">
        <div className="w-full">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-2 tracking-tight">
              Create an account
            </h2>
            <p className="text-text-secondary">
              Register to access the student portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {apiError && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-input text-body border border-red-100">
                {apiError}
              </div>
            )}

            <div className="mb-5">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setErrors(prev => ({ ...prev, fullName: '' })); }}
                placeholder="Enter your full name"
                required
                error={errors.fullName}
              />
            </div>

            <div className="mb-5">
              <Input
                type="email"
                label="Email Address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                placeholder="you@example.com"
                required
                autoComplete="email"
                error={errors.email}
              />
            </div>

            <div className="mb-5">
              <Input
                type="password"
                label="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
                error={errors.password}
              />
            </div>

            <div className="mb-8">
              <Input
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
                error={errors.confirmPassword}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="w-full"
            >
              Register
            </Button>

            <p className="text-center mt-6 text-body text-text-secondary">
              Already have an account?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="text-primary font-medium hover:text-primary-dark hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
