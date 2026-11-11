'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await createClient().auth.signInWithPassword({ email, password });
    if (err) {
      setBusy(false);
      setError('Incorrect email or password.');
      return;
    }
    router.replace('/');
    router.refresh();
  }

  return (
    <div className="login">
      <div className="login-card card">
        <div className="brand brand-lg">
          <span className="brand-mark" aria-hidden>
            P
          </span>
          <span className="brand-name">Pips Ledger</span>
        </div>
        <h1>Sign in</h1>
        <p className="muted">Trade journal for the Funding Pips accounts.</p>
        <form onSubmit={onSubmit} className="form-stack">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
