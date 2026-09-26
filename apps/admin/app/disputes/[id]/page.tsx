'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { RequireAdmin } from '@/components/RequireAdmin';
import { StatusBadge } from '@/components/StatusBadge';
import { AdminDispute, DisputeResolution, opsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

const OPTIONS: DisputeResolution[] = ['REFUND_TOURIST', 'PARTIAL_REFUND', 'RELEASE_TO_GUIDE'];

/** Phone · email, each kept left-to-right inside RTL text. */
function ContactLine({ values }: { values: Array<string | null | undefined> }) {
  const parts = values.filter((v): v is string => Boolean(v));
  if (!parts.length) return null;
  return (
    <div className="muted small">
      {parts.map((p, i) => (
        <span key={p}>
          {i > 0 && ' · '}
          <span className="ltr" dir="ltr">
            {p}
          </span>
        </span>
      ))}
    </div>
  );
}

function Detail() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<AdminDispute | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resolution, setResolution] = useState<DisputeResolution>('PARTIAL_REFUND');
  const [percent, setPercent] = useState(50);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const { t, label, formatDate, formatMoney } = useI18n();

  const load = useCallback(() => {
    opsApi.dispute(id).then(setD).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  if (!d) return <div className="muted">{error ?? t('common.loading')}</div>;

  const b = d.booking;
  const total = b.payment?.amountMinor ?? b.totalMinor;
  const refundPct = resolution === 'REFUND_TOURIST' ? 100 : resolution === 'RELEASE_TO_GUIDE' ? 0 : percent;
  const refund = Math.round((total * refundPct) / 100);
  const guideGets = total ? Math.round((b.guidePayoutMinor * (total - refund)) / total) : 0;
  const open = d.status === 'OPEN';

  async function resolve() {
    if (!confirm(t('dispute.confirm', { refund: formatMoney(refund, b.currency), payout: formatMoney(guideGets, b.currency) }))) return;
    setBusy(true);
    setError(null);
    try {
      await opsApi.resolve(d!.id, {
        resolution,
        refundPercent: resolution === 'PARTIAL_REFUND' ? percent : undefined,
        note: note.trim() || undefined,
      });
      setNotice(t('dispute.resolved'));
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link href="/disputes" className="muted small">
        {t('dispute.back')}
      </Link>
      <div className="page-head">
        <div>
          <h2>{b.package?.title}</h2>
          <StatusBadge kind="disputeStatus" tone={open ? 'warn' : 'ok'} status={d.status} />
        </div>
      </div>
      {notice && <div className="alert ok">{notice}</div>}
      {error && <div className="alert bad">{error}</div>}

      <div className="grid">
        <section className="card">
          <h3>{t('dispute.complaint')}</h3>
          <dl>
            <dt>{t('dispute.reason')}</dt>
            <dd>{label('disputeReason', d.reason)}</dd>
            <dt>{t('dispute.openedBy')}</dt>
            <dd>{d.openedById === b.touristId ? t('common.tourist') : t('common.guide')}</dd>
            <dt>{t('dispute.opened')}</dt>
            <dd>{formatDate(d.createdAt)}</dd>
          </dl>
          <p className="bio" dir="auto">
            {d.description}
          </p>
        </section>
        <section className="card">
          <h3>{t('dispute.booking')}</h3>
          <dl>
            <dt>{t('dispute.tourDate')}</dt>
            <dd>{formatDate(b.startAt)}</dd>
            <dt>{t('dispute.city')}</dt>
            <dd>{b.package?.city?.name ?? '—'}</dd>
            <dt>{t('dispute.group')}</dt>
            <dd>{b.groupSize}</dd>
            <dt>{t('dispute.status')}</dt>
            <dd>{label('booking', b.status)}</dd>
            <dt>{t('dispute.completed')}</dt>
            <dd>{formatDate(b.completedAt)}</dd>
          </dl>
        </section>
        <section className="card">
          <h3>{t('dispute.people')}</h3>
          <dl>
            <dt>{t('common.tourist')}</dt>
            <dd>
              {b.tourist?.fullName}
              <ContactLine values={[b.tourist?.phone, b.tourist?.email]} />
            </dd>
            <dt>{t('common.guide')}</dt>
            <dd>
              {b.guide?.user?.fullName}
              <ContactLine values={[b.guide?.user?.phone, b.guide?.user?.email]} />
            </dd>
          </dl>
        </section>
        <section className="card">
          <h3>{t('dispute.money')}</h3>
          <dl>
            <dt>{t('dispute.paid')}</dt>
            <dd>{formatMoney(total, b.currency)}</dd>
            <dt>{t('dispute.guideShare')}</dt>
            <dd>{formatMoney(b.guidePayoutMinor, b.currency)}</dd>
            <dt>{t('dispute.escrow')}</dt>
            <dd>{label('escrow', b.payment?.escrowStatus)}</dd>
            {!open && (
              <>
                <dt>{t('dispute.refunded')}</dt>
                <dd>{formatMoney(b.payment?.refundedMinor ?? 0, b.currency)}</dd>
                <dt>{t('dispute.released')}</dt>
                <dd>{formatMoney(b.payment?.releasedMinor ?? 0, b.currency)}</dd>
              </>
            )}
            <dt>{t('dispute.gateway')}</dt>
            <dd className="mono small">
              <span className="ltr" dir="ltr">
                {b.payment?.provider} {b.payment?.providerRef}
              </span>
            </dd>
          </dl>
        </section>
      </div>

      <section className="card decision">
        <h3>{t('dispute.resolution')}</h3>
        {!open ? (
          <p>
            <b>{label('resolution', d.resolution)}</b>
            {d.refundPercent ? ` (${d.refundPercent}%)` : ''} {t('dispute.resolvedOn', { date: formatDate(d.resolvedAt) })}
            {d.resolutionNote && (
              <span className="muted">
                {' '}
                — <bdi>{d.resolutionNote}</bdi>
              </span>
            )}
          </p>
        ) : (
          <div className="stack">
            {OPTIONS.map((o) => (
              <label key={o} className="radio">
                <input type="radio" name="resolution" checked={resolution === o} onChange={() => setResolution(o)} />
                <span>
                  <b>{t(`dispute.opt.${o}`)}</b> <span className="muted small">{t(`dispute.opt.${o}.help`)}</span>
                </span>
              </label>
            ))}
            {resolution === 'PARTIAL_REFUND' && (
              <label>
                {t('dispute.refundPct', { percent })}
                <input type="range" min={1} max={99} value={percent} onChange={(e) => setPercent(Number(e.target.value))} />
              </label>
            )}
            <div className="alert neutral">
              {t('dispute.touristRefund')} <b>{formatMoney(refund, b.currency)}</b> · {t('dispute.guideReceives')}{' '}
              <b>{formatMoney(guideGets, b.currency)}</b>
            </div>
            <input placeholder={t('dispute.notePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="row">
              <button className="btn primary" disabled={busy} onClick={resolve}>
                {busy ? t('dispute.settling') : t('dispute.resolve')}
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default function DisputeDetailPage() {
  return (
    <RequireAdmin>
      <Detail />
    </RequireAdmin>
  );
}
