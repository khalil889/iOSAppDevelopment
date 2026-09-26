'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { adminApi, auth, safeNextPath } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await adminApi.login(email, password);
      if (res.user.role !== 'ADMIN') throw new Error(t('login.notAdmin'));
      auth.set(res.accessToken, res.refreshToken);
      router.replace(safeNextPath(params.get('next')));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card login" onSubmit={submit}>
      <LanguageToggle className="login-lang" />
      <h1>
        <span className="logo">◎</span> {t('app.title')}
      </h1>
      <p className="muted">{t('login.subtitle')}</p>
      <label>
        {t('login.email')}
        <input type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      </label>
      <label>
        {t('login.password')}
        <input type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <div className="alert bad">{error}</div>}
      <button className="btn primary" disabled={busy}>
        {busy ? t('login.submitting') : t('login.submit')}
      </button>
      {process.env.NEXT_PUBLIC_DEMO_HINT === 'true' && (
        <p className="muted small">
          {t('login.demoHint')}{' '}
          <span dir="ltr" className="ltr" style={{ display: 'inline-block' }}>
            admin@tourguide.test / Admin123!
          </span>
        </p>
      )}
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
