import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // Redirect is handled by LoginPage's useEffect based on user role
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text-primary mb-2 tracking-tight">
          Welcome back
        </h2>
        <p className="text-text-secondary">
          Sign in to your account to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-input text-body border border-red-100">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-6">
          <Input
            type="email"
            label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between mb-8">
          <label className="flex items-center gap-2 text-body cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-border text-primary focus:ring-primary"
            />
            <span className="text-text-primary">Remember me</span>
          </label>
          <a
            href="#"
            className="text-primary text-body font-medium hover:text-primary-dark hover:underline"
          >
            Forgot password?
          </a>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          className="w-full"
        >
          Sign in
        </Button>
      </form>
    </div>
  );
}
