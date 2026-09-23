'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { adminApi, auth } from '@/lib/api';

/** Client-side gate: redirects to /login unless the stored token belongs to an admin. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);

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
        </nav>
        <div className="spacer" />
        <span className="muted small">{name}</span>
        <button
          className="btn ghost small"
          onClick={() => {
            auth.clear();
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
