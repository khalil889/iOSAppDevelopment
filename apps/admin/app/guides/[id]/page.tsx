'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { RequireAdmin } from '@/components/RequireAdmin';
import { StatusBadge } from '@/components/StatusBadge';
import { AdminGuide, adminApi, fmtDate } from '@/lib/api';

type Mode = null | 'reject' | 'suspend';

const REJECT_TEMPLATES = [
  'License scan is unreadable — please upload a clearer photo.',
  'License number not found in the national tourism registry.',
  'Name on the license does not match the account name.',
  'License has expired — please submit a renewed license.',
];

function Detail() {
  const { id } = useParams<{ id: string }>();
  const [guide, setGuide] = useState<AdminGuide | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminApi.guide(id).then(setGuide).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  async function act(fn: () => Promise<AdminGuide>, done: string) {
    setBusy(true);
    setError(null);
    try {
      setGuide(await fn());
      setNotice(done);
      setMode(null);
      setReason('');
      setNote('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!guide) return <div className="muted">{error ?? 'Loading…'}</div>;

  const expired = guide.licenseExpiresAt ? new Date(`${guide.licenseExpiresAt}T23:59:59Z`) < new Date() : false;
  const pending = guide.verificationStatus === 'PENDING';

  return (
    <>
      <Link href="/guides" className="muted small">
        ← Back to queue
      </Link>
      <div className="page-head">
        <div className="who big">
          {guide.user.avatarUrl ? <img src={guide.user.avatarUrl} alt="" /> : <div className="avatar" />}
          <div>
            <h2>{guide.user.fullName}</h2>
            <StatusBadge status={guide.verificationStatus} />
          </div>
        </div>
      </div>

      {notice && <div className="alert ok">{notice}</div>}
      {error && <div className="alert bad">{error}</div>}

      <div className="grid">
        <section className="card">
          <h3>License</h3>
          <dl>
            <dt>Number</dt>
            <dd className="mono">{guide.licenseNumber ?? '—'}</dd>
            <dt>Issuing country</dt>
            <dd>{guide.licenseCountry?.name ?? '—'}</dd>
            <dt>Expires</dt>
            <dd>
              {guide.licenseExpiresAt ?? '—'} {expired && <span className="badge bad">expired</span>}
            </dd>
            <dt>Document</dt>
            <dd>
              {guide.licenseDocumentDownloadUrl ? (
                <button
                  className="btn small"
                  onClick={async () => {
                    // Signed links expire after 5 minutes; fetch a fresh one on click.
                    const fresh = await adminApi.guide(guide.id);
                    window.open(fresh.licenseDocumentDownloadUrl ?? undefined, '_blank', 'noopener');
                  }}
                >
                  View uploaded scan ↗
                </button>
              ) : guide.licenseDocumentUrl ? (
                <a href={guide.licenseDocumentUrl} target="_blank" rel="noreferrer">
                  Open linked scan ↗
                </a>
              ) : (
                <span className="muted">not provided</span>
              )}
            </dd>
            <dt>Submitted</dt>
            <dd>{fmtDate(guide.submittedAt)}</dd>
          </dl>
        </section>

        <section className="card">
          <h3>
            Automated check <StatusBadge status={guide.kycStatus} />
          </h3>
          {guide.kycResult ? (
            <>
              <p className="muted small">
                Provider <b>{guide.kycResult.provider}</b> · score {Math.round(guide.kycResult.score * 100)}% · ref{' '}
                <span className="mono">{guide.kycReference}</span>
              </p>
              <ul className="checks">
                {Object.entries(guide.kycResult.checks).map(([k, c]) => (
                  <li key={k} className={c.passed ? 'pass' : 'fail'}>
                    <span>{c.passed ? '✓' : '✕'}</span> {k.replace(/_/g, ' ')}
                    {c.detail && !c.passed && <span className="muted small"> — {c.detail}</span>}
                  </li>
                ))}
              </ul>
              <p className="muted small">Automated results are advisory; the decision is yours.</p>
            </>
          ) : (
            <p className="muted">No check has been run.</p>
          )}
        </section>

        <section className="card">
          <h3>Contact</h3>
          <dl>
            <dt>Email</dt>
            <dd>{guide.user.email ?? '—'}</dd>
            <dt>Phone</dt>
            <dd>
              {guide.user.phone ?? '—'}{' '}
              {guide.user.phoneVerifiedAt ? <span className="badge ok">verified</span> : <span className="badge warn">unverified</span>}
            </dd>
          </dl>
        </section>

        <section className="card">
          <h3>Profile</h3>
          <dl>
            <dt>Languages</dt>
            <dd>{guide.languages.map((l) => l.toUpperCase()).join(', ') || '—'}</dd>
            <dt>Experience</dt>
            <dd>{guide.yearsOfExperience} years</dd>
            <dt>Cities</dt>
            <dd>{guide.cities.map((c) => c.name).join(', ') || '—'}</dd>
            <dt>Sites</dt>
            <dd>{guide.sites?.map((s) => s.name).join(', ') || '—'}</dd>
          </dl>
          {guide.bio && <p className="bio">{guide.bio}</p>}
        </section>
      </div>

      <section className="card decision">
        <h3>Decision</h3>
        {guide.rejectionReason && !pending && (
          <p>
            <b>Reason on file:</b> {guide.rejectionReason}
          </p>
        )}

        {pending && mode === null && (
          <div className="row">
            <input
              placeholder="Optional note for the audit log"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              className="btn primary"
              disabled={busy || expired}
              title={expired ? 'License has expired' : ''}
              onClick={() => act(() => adminApi.approve(guide.id, note || undefined), 'Guide approved — they can now receive bookings.')}
            >
              ✓ Approve
            </button>
            <button className="btn danger" disabled={busy} onClick={() => setMode('reject')}>
              ✕ Reject
            </button>
          </div>
        )}

        {guide.verificationStatus === 'APPROVED' && mode === null && (
          <button className="btn danger ghost" onClick={() => setMode('suspend')}>
            Suspend guide
          </button>
        )}

        {mode && (
          <div className="stack">
            <label>
              {mode === 'reject' ? 'Rejection reason (shown to the guide)' : 'Suspension reason'}
              <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
            </label>
            {mode === 'reject' && (
              <div className="chips">
                {REJECT_TEMPLATES.map((t) => (
                  <button key={t} type="button" className="chip" onClick={() => setReason(t)}>
                    {t}
                  </button>
                ))}
              </div>
            )}
            <div className="row">
              <button
                className="btn danger"
                disabled={busy || reason.trim().length < 5}
                onClick={() =>
                  act(
                    () => (mode === 'reject' ? adminApi.reject(guide.id, reason) : adminApi.suspend(guide.id, reason)),
                    mode === 'reject' ? 'Guide rejected — they can fix and resubmit.' : 'Guide suspended.',
                  )
                }
              >
                Confirm {mode}
              </button>
              <button className="btn ghost" onClick={() => setMode(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {!pending && guide.verificationStatus !== 'APPROVED' && <p className="muted">No actions available for this status.</p>}
      </section>

      <section className="card">
        <h3>History</h3>
        <ol className="timeline">
          {(guide.history ?? []).map((h) => (
            <li key={h.id}>
              <span className="muted small">{fmtDate(h.createdAt)}</span>
              <div>
                <StatusBadge status={h.fromStatus} /> → <StatusBadge status={h.toStatus} />
                {h.note && <div className="small">{h.note}</div>}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

export default function GuideDetailPage() {
  return (
    <RequireAdmin>
      <Detail />
    </RequireAdmin>
  );
}
