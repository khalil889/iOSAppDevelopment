'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { RequireAdmin } from '@/components/RequireAdmin';
import { StatusBadge } from '@/components/StatusBadge';
import { AdminDispute, opsApi, Paginated } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

const TABS = ['OPEN', 'RESOLVED'] as const;

function DisputeList() {
  const router = useRouter();
  const params = useSearchParams();
  const status = (params.get('status') as 'OPEN' | 'RESOLVED') || 'OPEN';
  const [data, setData] = useState<Paginated<AdminDispute> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t, label, formatMoney, formatDate, timeAgo } = useI18n();

  const load = useCallback(() => {
    setError(null);
    opsApi.disputes(status).then(setData).catch((e) => setError(e.message));
  }, [status]);
  useEffect(load, [load]);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>{t('disputes.title')}</h2>
          <p className="muted">{t('disputes.subtitle')}</p>
        </div>
        <button className="btn ghost" onClick={load}>
          {t('common.refresh')}
        </button>
      </div>
      <div className="tabs">
        {TABS.map((key) => (
          <button key={key} className={key === status ? 'tab active' : 'tab'} onClick={() => router.push(`/disputes?status=${key}`)}>
            {label('disputeStatus', key)}
          </button>
        ))}
      </div>
      {error && <div className="alert bad">{error}</div>}
      {!data && !error && <div className="muted">{t('common.loading')}</div>}
      {data && data.items.length === 0 && (
        <div className="empty card">{status === 'OPEN' ? t('disputes.emptyOpen') : t('disputes.emptyResolved')}</div>
      )}
      {data && data.items.length > 0 && (
        <table className="table card">
          <thead>
            <tr>
              <th>{t('disputes.col.tour')}</th>
              <th>{t('disputes.col.reason')}</th>
              <th>{t('disputes.col.openedBy')}</th>
              <th>{t('disputes.col.amount')}</th>
              <th>{t('disputes.col.escrow')}</th>
              <th>{status === 'OPEN' ? t('disputes.col.opened') : t('disputes.col.resolution')}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((d) => (
              <tr key={d.id} className="clickable" onClick={() => router.push(`/disputes/${d.id}`)}>
                <td>
                  <strong>{d.booking.package?.title}</strong>
                  <div className="muted small">
                    {t('disputes.touristWithGuide', { tourist: d.booking.tourist?.fullName ?? '—', guide: d.booking.guide?.user?.fullName ?? '—' })}
                  </div>
                </td>
                <td>{label('disputeReason', d.reason)}</td>
                <td>{d.openedById === d.booking.touristId ? t('common.tourist') : t('common.guide')}</td>
                <td>{formatMoney(d.booking.totalMinor, d.booking.currency)}</td>
                <td>
                  <StatusBadge kind="escrow" tone="warn" status={d.booking.payment?.escrowStatus ?? ''} />
                </td>
                <td title={status === 'OPEN' ? formatDate(d.createdAt) : undefined}>
                  {status === 'OPEN' ? timeAgo(d.createdAt) : label('resolution', d.resolution)}
                </td>
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
