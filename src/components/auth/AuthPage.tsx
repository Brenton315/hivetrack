import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Logo from '../layout/Logo';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: err } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--page)', padding: 16 }}>
      <div className="hq-card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Logo size={40} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink)' }}>hivehq</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>Hive management for NZ beekeepers.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="hq-field">
            <label className="hq-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="hq-input"
            />
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              minLength={6}
              className="hq-input"
            />
          </div>

          {error && <p className="hq-error" style={{ marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={loading} className="hq-btn-primary" style={{ width: '100%', minHeight: 44 }}>
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 16 }}>
          {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="hq-link"
          >
            {isSignUp ? 'Log in' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  );
}
