'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { adminApi, auth, opsApi } from '@/lib/api';

/** Client-side gate: redirects to /login unless the stored token belongs to an admin. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);
  const [openSos, setOpenSos] = useState(0);

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

  if (!name) return <div className="center muted">Checking session…</div>;

  return (
    <div className="shell">
      <header className="topbar">
        <a href="/guides" className="brand">
          <span className="logo">◎</span> TourGuide Admin
        </a>
        <nav>
          <a href="/guides" className={pathname.startsWith('/guides') ? 'active' : ''}>
            Guide verification
          </a>
          <a href="/disputes" className={pathname.startsWith('/disputes') ? 'active' : ''}>
            Disputes
          </a>
          <a href="/sos" className={pathname.startsWith('/sos') ? 'active' : ''}>
            SOS {openSos > 0 && <span className="pill-alert">{openSos}</span>}
          </a>
        </nav>
        <div className="spacer" />
        <span className="muted small">{name}</span>
        <button
          className="btn ghost small"
          onClick={async () => {
            await adminApi.logout();
            router.replace('/login');
          }}
        >
          Sign out
        </button>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
