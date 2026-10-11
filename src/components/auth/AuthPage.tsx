import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🐝</div>
          <h1 className="text-2xl font-bold text-gray-900">HiveTrack</h1>
          <p className="text-sm text-gray-500 mt-1">Trial hive management for NZ beekeepers</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 font-medium">Check your email</p>
              <p className="text-green-600 text-sm mt-1">
                We sent a login link to <strong>{email}</strong>
              </p>
            </div>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-sm text-amber-600 underline"
            >
              Try a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-base transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send login link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
