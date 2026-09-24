'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { RequireAdmin } from '@/components/RequireAdmin';
import { AdminDispute, fmtMoney, opsApi, Paginated, timeAgo } from '@/lib/api';

const TABS = [
  ['OPEN', 'Open'],
  ['RESOLVED', 'Resolved'],
] as const;

function DisputeList() {
  const router = useRouter();
  const params = useSearchParams();
  const status = (params.get('status') as 'OPEN' | 'RESOLVED') || 'OPEN';
  const [data, setData] = useState<Paginated<AdminDispute> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    opsApi.disputes(status).then(setData).catch((e) => setError(e.message));
  }, [status]);
  useEffect(load, [load]);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Disputes</h2>
          <p className="muted">Escrow stays frozen until a dispute is resolved. Oldest first.</p>
        </div>
        <button className="btn ghost" onClick={load}>
          Refresh
        </button>
      </div>
      <div className="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} className={key === status ? 'tab active' : 'tab'} onClick={() => router.push(`/disputes?status=${key}`)}>
            {label}
          </button>
        ))}
      </div>
      {error && <div className="alert bad">{error}</div>}
      {!data && !error && <div className="muted">Loading…</div>}
      {data && data.items.length === 0 && (
        <div className="empty card">{status === 'OPEN' ? 'No open disputes.' : 'No resolved disputes yet.'}</div>
      )}
      {data && data.items.length > 0 && (
        <table className="table card">
          <thead>
            <tr>
              <th>Tour</th>
              <th>Reason</th>
              <th>Opened by</th>
              <th>Amount</th>
              <th>Escrow</th>
              <th>{status === 'OPEN' ? 'Opened' : 'Resolution'}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((d) => (
              <tr key={d.id} className="clickable" onClick={() => router.push(`/disputes/${d.id}`)}>
                <td>
                  <strong>{d.booking.package?.title}</strong>
                  <div className="muted small">
                    {d.booking.tourist?.fullName} with {d.booking.guide?.user?.fullName}
                  </div>
                </td>
                <td>{d.reason.replace(/_/g, ' ').toLowerCase()}</td>
                <td>{d.openedById === d.booking.touristId ? 'Tourist' : 'Guide'}</td>
                <td>{fmtMoney(d.booking.totalMinor, d.booking.currency)}</td>
                <td>
                  <span className="badge warn">{(d.booking.payment?.escrowStatus ?? '—').replace('_', ' ').toLowerCase()}</span>
                </td>
                <td>{status === 'OPEN' ? timeAgo(d.createdAt) : (d.resolution ?? '').replace(/_/g, ' ').toLowerCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export default function DisputesPage() {
  return (
    <RequireAdmin>
      <Suspense>
        <DisputeList />
      </Suspense>
    </RequireAdmin>
  );
}
