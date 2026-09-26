'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { RequireAdmin } from '@/components/RequireAdmin';
import { AdminDispute, DisputeResolution, fmtDate, fmtMoney, opsApi } from '@/lib/api';

const OPTIONS: Array<{ value: DisputeResolution; label: string; help: string }> = [
  { value: 'REFUND_TOURIST', label: 'Refund tourist in full', help: 'The guide receives nothing.' },
  { value: 'PARTIAL_REFUND', label: 'Partial refund', help: 'Refund a percentage; the guide gets the rest minus the platform fee.' },
  { value: 'RELEASE_TO_GUIDE', label: 'Release to guide', help: 'No refund; the guide is paid as normal.' },
];

function Detail() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<AdminDispute | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resolution, setResolution] = useState<DisputeResolution>('PARTIAL_REFUND');
  const [percent, setPercent] = useState(50);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    opsApi.dispute(id).then(setD).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  if (!d) return <div className="muted">{error ?? 'Loading…'}</div>;

  const b = d.booking;
  const total = b.payment?.amountMinor ?? b.totalMinor;
  const refundPct = resolution === 'REFUND_TOURIST' ? 100 : resolution === 'RELEASE_TO_GUIDE' ? 0 : percent;
  const refund = Math.round((total * refundPct) / 100);
  const guideGets = total ? Math.round((b.guidePayoutMinor * (total - refund)) / total) : 0;
  const open = d.status === 'OPEN';

  async function resolve() {
    if (!confirm(`Refund ${fmtMoney(refund, b.currency)} and pay the guide ${fmtMoney(guideGets, b.currency)}? This moves money and can't be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await opsApi.resolve(d!.id, {
        resolution,
        refundPercent: resolution === 'PARTIAL_REFUND' ? percent : undefined,
        note: note.trim() || undefined,
      });
      setNotice('Dispute resolved and escrow settled.');
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
        ← Back to disputes
      </Link>
      <div className="page-head">
        <div>
          <h2>{b.package?.title}</h2>
          <span className={`badge ${open ? 'warn' : 'ok'}`}>{d.status.toLowerCase()}</span>
        </div>
      </div>
      {notice && <div className="alert ok">{notice}</div>}
      {error && <div className="alert bad">{error}</div>}

      <div className="grid">
        <section className="card">
          <h3>Complaint</h3>
          <dl>
            <dt>Reason</dt>
            <dd>{d.reason.replace(/_/g, ' ').toLowerCase()}</dd>
            <dt>Opened by</dt>
            <dd>{d.openedById === b.touristId ? 'Tourist' : 'Guide'}</dd>
            <dt>Opened</dt>
            <dd>{fmtDate(d.createdAt)}</dd>
          </dl>
          <p className="bio">{d.description}</p>
        </section>
        <section className="card">
          <h3>Booking</h3>
          <dl>
            <dt>Tour date</dt>
            <dd>{fmtDate(b.startAt)}</dd>
            <dt>City</dt>
            <dd>{b.package?.city?.name ?? '—'}</dd>
            <dt>Group</dt>
            <dd>{b.groupSize}</dd>
            <dt>Status</dt>
            <dd>{b.status.replace('_', ' ').toLowerCase()}</dd>
            <dt>Completed</dt>
            <dd>{fmtDate(b.completedAt)}</dd>
          </dl>
        </section>
        <section className="card">
          <h3>People</h3>
          <dl>
            <dt>Tourist</dt>
            <dd>
              {b.tourist?.fullName}
              <div className="muted small">{[b.tourist?.phone, b.tourist?.email].filter(Boolean).join(' · ')}</div>
            </dd>
            <dt>Guide</dt>
            <dd>
              {b.guide?.user?.fullName}
              <div className="muted small">{[b.guide?.user?.phone, b.guide?.user?.email].filter(Boolean).join(' · ')}</div>
            </dd>
          </dl>
        </section>
        <section className="card">
          <h3>Money</h3>
          <dl>
            <dt>Paid</dt>
            <dd>{fmtMoney(total, b.currency)}</dd>
            <dt>Guide share</dt>
            <dd>{fmtMoney(b.guidePayoutMinor, b.currency)}</dd>
            <dt>Escrow</dt>
            <dd>{b.payment?.escrowStatus?.replace('_', ' ').toLowerCase() ?? '—'}</dd>
            {!open && (
              <>
                <dt>Refunded</dt>
                <dd>{fmtMoney(b.payment?.refundedMinor ?? 0, b.currency)}</dd>
                <dt>Released</dt>
                <dd>{fmtMoney(b.payment?.releasedMinor ?? 0, b.currency)}</dd>
              </>
            )}
            <dt>Gateway</dt>
            <dd className="mono small">
              {b.payment?.provider} {b.payment?.providerRef}
            </dd>
          </dl>
        </section>
      </div>

      <section className="card decision">
        <h3>Resolution</h3>
        {!open ? (
          <p>
            <b>{(d.resolution ?? '').replace(/_/g, ' ').toLowerCase()}</b>
            {d.refundPercent ? ` (${d.refundPercent}%)` : ''} on {fmtDate(d.resolvedAt)}
            {d.resolutionNote && <span className="muted"> — {d.resolutionNote}</span>}
          </p>
        ) : (
          <div className="stack">
            {OPTIONS.map((o) => (
              <label key={o.value} className="radio">
                <input type="radio" name="resolution" checked={resolution === o.value} onChange={() => setResolution(o.value)} />
                <span>
                  <b>{o.label}</b> <span className="muted small">{o.help}</span>
                </span>
              </label>
            ))}
            {resolution === 'PARTIAL_REFUND' && (
              <label>
                Refund percentage: {percent}%
                <input type="range" min={1} max={99} value={percent} onChange={(e) => setPercent(Number(e.target.value))} />
              </label>
            )}
            <div className="alert neutral">
              Tourist refund <b>{fmtMoney(refund, b.currency)}</b> · Guide receives <b>{fmtMoney(guideGets, b.currency)}</b>
            </div>
            <input placeholder="Note for the audit log (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="row">
              <button className="btn primary" disabled={busy} onClick={resolve}>
                {busy ? 'Settling…' : 'Resolve dispute'}
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
