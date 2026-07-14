import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Loader } from 'lucide-react';
import { authAPI, getApiErrorMessage } from '../../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>(token ? 'pending' : 'error');
  const [message, setMessage] = useState(token ? 'Verifying your email...' : 'Missing verification token.');

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const result = await authAPI.verifyEmail(token);
        if (cancelled) return;
        setStatus('success');
        setMessage(result.message);
        window.setTimeout(() => navigate('/login', { replace: true }), 1500);
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setMessage(getApiErrorMessage(err, 'Verification failed'));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Email verification</h2>
        {status === 'pending' && (
          <div className="inline-flex items-center gap-2 text-gray-600">
            <Loader className="w-4 h-4 animate-spin" />
            {message}
          </div>
        )}
        {status === 'success' && (
          <p className="text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm">{message}</p>
        )}
        {status === 'error' && (
          <p className="text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm">{message}</p>
        )}
        <Link to="/login" className="inline-block mt-6 text-emerald-600 font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
