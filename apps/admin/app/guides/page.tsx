'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { RequireAdmin } from '@/components/RequireAdmin';
import { StatusBadge } from '@/components/StatusBadge';
import { AdminGuide, adminApi, Paginated, VerificationStatus } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

const TABS: VerificationStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

function Queue() {
  const router = useRouter();
  const params = useSearchParams();
  const status = (params.get('status') as VerificationStatus) || 'PENDING';
  const page = Number(params.get('page') ?? 1);
  const { t, label, timeAgo, formatDate } = useI18n();

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
          <h2>{t('guides.title')}</h2>
          <p className="muted">{t('guides.subtitle')}</p>
        </div>
        <button className="btn ghost" onClick={load}>
          {t('common.refresh')}
        </button>
      </div>

      <div className="tabs">
        {TABS.map((s) => (
          <button key={s} className={s === status ? 'tab active' : 'tab'} onClick={() => go(s)}>
            {label('verification', s)} <span className="count">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {error && <div className="alert bad">{error}</div>}
      {!data && !error && <div className="muted">{t('common.loading')}</div>}

      {data && data.items.length === 0 && (
        <div className="empty card">
          {status === 'PENDING' ? t('guides.emptyPending') : t('guides.emptyOther')}
        </div>
      )}

      {data && data.items.length > 0 && (
        <table className="table card">
          <thead>
            <tr>
              <th>{t('guides.col.guide')}</th>
              <th>{t('guides.col.license')}</th>
              <th>{t('guides.col.country')}</th>
              <th>{t('guides.col.check')}</th>
              <th>{t('guides.col.cities')}</th>
              <th>{t('guides.col.submitted')}</th>
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
                      <div className="muted small ltr" dir="ltr">
                        {g.user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="mono ltr" dir="ltr">
                    {g.licenseNumber ?? '—'}
                  </span>
                </td>
                <td>{g.licenseCountry?.name ?? '—'}</td>
                <td>
                  <StatusBadge kind="kyc" status={g.kycStatus} />
                  {g.kycResult && <span className="muted small"> {Math.round(g.kycResult.score * 100)}%</span>}
                </td>
                <td>{g.cities.map((c) => c.name).join(t('common.listSep')) || '—'}</td>
                <td title={formatDate(g.submittedAt)}>{timeAgo(g.submittedAt)}</td>
                <td>
                  <Link href={`/guides/${g.id}`} className="btn small" onClick={(e) => e.stopPropagation()}>
                    {t('guides.review')}
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
            {t('common.prev')}
          </button>
          <span className="muted small">
            {t('common.pageOf', { page, pages })}
          </span>
          <button className="btn ghost small" disabled={page >= pages} onClick={() => go(status, page + 1)}>
            {t('common.next')}
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
