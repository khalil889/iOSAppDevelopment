'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { adminApi, auth } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await adminApi.login(email, password);
      if (res.user.role !== 'ADMIN') throw new Error('This account does not have admin access.');
      auth.set(res.accessToken);
      router.replace(params.get('next') || '/guides');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card login" onSubmit={submit}>
      <h1>
        <span className="logo">◎</span> TourGuide Admin
      </h1>
      <p className="muted">Sign in to review guide applications.</p>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <div className="alert bad">{error}</div>}
      <button className="btn primary" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="muted small">Seeded admin: admin@tourguide.test / Admin123!</p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="center">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
