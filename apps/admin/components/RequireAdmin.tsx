'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { adminApi, auth, opsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from './LanguageToggle';

/** Client-side gate: redirects to /login unless the stored token belongs to an admin. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);
  const [openSos, setOpenSos] = useState(0);
  const { t } = useI18n();

  useEffect(() => {
    if (!auth.token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    adminApi
      .me()
      .then((u) => {
        if (u.role !== 'ADMIN') throw new Error('not admin');
        setName(u.fullName);
        // Badge only: a failure here must not sign the admin out.
        opsApi.sosCounts().then((c) => setOpenSos(c.open)).catch(() => undefined);
      })
      .catch(() => {
        auth.clear();
        router.replace('/login');
      });
  }, [router, pathname]);

  if (!name) return <div className="center muted">{t('auth.checking')}</div>;

  return (
    <div className="shell">
      <header className="topbar">
        <a href="/analytics" className="brand">
          <span className="logo">◎</span> {t('app.title')}
        </a>
        <nav aria-label={t('nav.label')}>
          <a href="/analytics" className={pathname.startsWith('/analytics') ? 'active' : ''}>
            {t('nav.overview')}
          </a>
          <a href="/guides" className={pathname.startsWith('/guides') ? 'active' : ''}>
            {t('nav.guides')}
          </a>
          <a href="/disputes" className={pathname.startsWith('/disputes') ? 'active' : ''}>
            {t('nav.disputes')}
          </a>
          <a href="/payouts" className={pathname.startsWith('/payouts') ? 'active' : ''}>
            {t('nav.payouts')}
          </a>
          <a href="/sos" className={pathname.startsWith('/sos') ? 'active' : ''}>
            {t('nav.sos')} {openSos > 0 && <span className="pill-alert">{openSos}</span>}
          </a>
        </nav>
        <div className="spacer" />
        <LanguageToggle />
        <span className="muted small">
          <bdi>{name}</bdi>
        </span>
        <button
          className="btn ghost small"
          onClick={async () => {
            await adminApi.logout();
            router.replace('/login');
          }}
        >
          {t('nav.signOut')}
        </button>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
