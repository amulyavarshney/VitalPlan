import { useState, type FormEvent } from 'react';
import { Heart, Loader, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth, getApiErrorMessage } from '../../hooks/useAuth';
import { authAPI } from '../../services/api';

interface AuthFormProps {
  initialMode?: 'login' | 'register' | 'reset';
  onSuccess?: () => void;
}

export default function AuthForm({ initialMode = 'login', onSuccess }: AuthFormProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onSuccess?.();
      } else if (mode === 'register') {
        if (!name.trim()) {
          setError('Name is required');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setIsSubmitting(false);
          return;
        }
        await register({ name: name.trim(), email, password });
        onSuccess?.();
      } else if (!resetToken) {
        const result = await authAPI.requestPasswordReset(email);
        setInfo(result.message);
        if (result.reset_token) {
          setResetToken(result.reset_token);
          setInfo(`${result.message} Dev token ready — enter a new password below.`);
        }
      } else {
        await authAPI.confirmPasswordReset(resetToken, password);
        setInfo('Password updated. You can sign in now.');
        setMode('login');
        setResetToken('');
        setPassword('');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Authentication failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' && 'Welcome back'}
            {mode === 'register' && 'Create your account'}
            {mode === 'reset' && 'Reset your password'}
          </h2>
          <p className="text-gray-600 mt-2">
            {mode === 'login' && 'Sign in to access your personalized nutrition plan'}
            {mode === 'register' && 'Start your personalized nutrition journey'}
            {mode === 'reset' && 'We will help you set a new password'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Your name"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {(mode !== 'reset' || !!resetToken) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mode === 'reset' ? 'New password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="••••••••"
                  required={mode !== 'reset' || !!resetToken}
                  minLength={6}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {info && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium py-3 rounded-xl hover:opacity-95 disabled:opacity-60 transition"
          >
            {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
            {mode === 'login' && 'Sign in'}
            {mode === 'register' && 'Create account'}
            {mode === 'reset' && (!resetToken ? 'Send reset link' : 'Update password')}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600 mt-6 space-y-2">
          {mode === 'login' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setError(null);
                  setInfo(null);
                }}
                className="text-emerald-600 font-medium hover:underline block w-full"
              >
                Forgot password?
              </button>
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setInfo(null);
                  }}
                  className="text-emerald-600 font-medium hover:underline"
                >
                  Sign up
                </button>
              </p>
            </>
          )}
          {mode !== 'login' && (
            <p>
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setInfo(null);
                  setResetToken('');
                }}
                className="text-emerald-600 font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
