'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { RequireAdmin } from '@/components/RequireAdmin';
import { StatusBadge } from '@/components/StatusBadge';
import { AdminGuide, adminApi, Paginated, timeAgo, VerificationStatus } from '@/lib/api';

const TABS: VerificationStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

function Queue() {
  const router = useRouter();
  const params = useSearchParams();
  const status = (params.get('status') as VerificationStatus) || 'PENDING';
  const page = Number(params.get('page') ?? 1);

  const [data, setData] = useState<Paginated<AdminGuide> | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([adminApi.queue(status, page), adminApi.counts()])
      .then(([q, c]) => {
        setData(q);
        setCounts(c);
      })
      .catch((e) => setError(e.message));
  }, [status, page]);

  useEffect(load, [load]);

  const go = (s: VerificationStatus, p = 1) => router.push(`/guides?status=${s}&page=${p}`);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Guide verification</h2>
          <p className="muted">Review license submissions. Oldest first.</p>
        </div>
        <button className="btn ghost" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={t === status ? 'tab active' : 'tab'} onClick={() => go(t)}>
            {t.toLowerCase()} <span className="count">{counts[t] ?? 0}</span>
          </button>
        ))}
      </div>

      {error && <div className="alert bad">{error}</div>}
      {!data && !error && <div className="muted">Loading…</div>}

      {data && data.items.length === 0 && (
        <div className="empty card">
          {status === 'PENDING' ? '🎉 The queue is empty — no guides waiting for review.' : 'No guides with this status.'}
        </div>
      )}

      {data && data.items.length > 0 && (
        <table className="table card">
          <thead>
            <tr>
              <th>Guide</th>
              <th>License</th>
              <th>Country</th>
              <th>Automated check</th>
              <th>Cities</th>
              <th>Submitted</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.items.map((g) => (
              <tr key={g.id} onClick={() => router.push(`/guides/${g.id}`)} className="clickable">
                <td>
                  <div className="who">
                    {g.user.avatarUrl ? <img src={g.user.avatarUrl} alt="" /> : <div className="avatar" />}
                    <div>
                      <strong>{g.user.fullName}</strong>
                      <div className="muted small">{g.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="mono">{g.licenseNumber ?? '—'}</td>
                <td>{g.licenseCountry?.name ?? '—'}</td>
                <td>
                  <StatusBadge status={g.kycStatus} />
                  {g.kycResult && <span className="muted small"> {Math.round(g.kycResult.score * 100)}%</span>}
                </td>
                <td>{g.cities.map((c) => c.name).join(', ') || '—'}</td>
                <td title={g.submittedAt ?? ''}>{timeAgo(g.submittedAt)}</td>
                <td>
                  <Link href={`/guides/${g.id}`} className="btn small" onClick={(e) => e.stopPropagation()}>
                    Review →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pages > 1 && (
        <div className="pager">
          <button className="btn ghost small" disabled={page <= 1} onClick={() => go(status, page - 1)}>
            ← Prev
          </button>
          <span className="muted small">
            Page {page} of {pages}
          </span>
          <button className="btn ghost small" disabled={page >= pages} onClick={() => go(status, page + 1)}>
            Next →
          </button>
        </div>
      )}
    </>
  );
}

export default function GuidesPage() {
  return (
    <RequireAdmin>
      <Suspense>
        <Queue />
      </Suspense>
    </RequireAdmin>
  );
}
