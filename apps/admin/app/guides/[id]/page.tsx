'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { RequireAdmin } from '@/components/RequireAdmin';
import { StatusBadge } from '@/components/StatusBadge';
import { AdminGuide, adminApi } from '@/lib/api';
import { MessageKey, useI18n } from '@/lib/i18n';

type Mode = null | 'reject' | 'suspend';

const REJECT_TEMPLATES: MessageKey[] = [
  'guide.template.unreadable',
  'guide.template.notInRegistry',
  'guide.template.nameMismatch',
  'guide.template.expired',
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
  const { t, label, dir, formatDate, formatDay, languageName } = useI18n();

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

  if (!guide) return <div className="muted">{error ?? t('common.loading')}</div>;

  const expired = guide.licenseExpiresAt ? new Date(`${guide.licenseExpiresAt}T23:59:59Z`) < new Date() : false;
  const pending = guide.verificationStatus === 'PENDING';

  return (
    <>
      <Link href="/guides" className="muted small">
        {t('guide.back')}
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
          <h3>{t('guide.license')}</h3>
          <dl>
            <dt>{t('guide.number')}</dt>
            <dd>
              <span className="mono ltr" dir="ltr">
                {guide.licenseNumber ?? '—'}
              </span>
            </dd>
            <dt>{t('guide.issuingCountry')}</dt>
            <dd>{guide.licenseCountry?.name ?? '—'}</dd>
            <dt>{t('guide.expires')}</dt>
            <dd>
              {formatDay(guide.licenseExpiresAt)} {expired && <span className="badge bad">{t('guide.expired')}</span>}
            </dd>
            <dt>{t('guide.document')}</dt>
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
                  {t('guide.viewScan')}
                </button>
              ) : guide.licenseDocumentUrl ? (
                <a href={guide.licenseDocumentUrl} target="_blank" rel="noreferrer">
                  {t('guide.openScan')}
                </a>
              ) : (
                <span className="muted">{t('guide.notProvided')}</span>
              )}
            </dd>
            <dt>{t('guide.submitted')}</dt>
            <dd>{formatDate(guide.submittedAt)}</dd>
          </dl>
        </section>

        <section className="card">
          <h3>
            {t('guide.check')} <StatusBadge kind="kyc" status={guide.kycStatus} />
          </h3>
          {guide.kycResult ? (
            <>
              <p className="muted small">
                {t('guide.provider')} <b>{guide.kycResult.provider}</b> · {t('guide.score', { score: Math.round(guide.kycResult.score * 100) })} ·{' '}
                {t('guide.ref')}{' '}
                <span className="mono ltr" dir="ltr">
                  {guide.kycReference}
                </span>
              </p>
              <ul className="checks">
                {Object.entries(guide.kycResult.checks).map(([k, c]) => (
                  <li key={k} className={c.passed ? 'pass' : 'fail'}>
                    <span>{c.passed ? '✓' : '✕'}</span> {label('kycCheck', k)}
                    {c.detail && !c.passed && <span className="muted small"> — {c.detail}</span>}
                  </li>
                ))}
              </ul>
              <p className="muted small">{t('guide.advisory')}</p>
            </>
          ) : (
            <p className="muted">{t('guide.noCheck')}</p>
          )}
        </section>

        <section className="card">
          <h3>{t('guide.contact')}</h3>
          <dl>
            <dt>{t('guide.email')}</dt>
            <dd>
              <span className="ltr" dir="ltr">
                {guide.user.email ?? '—'}
              </span>
            </dd>
            <dt>{t('guide.phone')}</dt>
            <dd>
              <span className="ltr" dir="ltr">
                {guide.user.phone ?? '—'}
              </span>{' '}
              {guide.user.phoneVerifiedAt ? (
                <span className="badge ok">{t('guide.verified')}</span>
              ) : (
                <span className="badge warn">{t('guide.unverified')}</span>
              )}
            </dd>
          </dl>
        </section>

        <section className="card">
          <h3>{t('guide.profile')}</h3>
          <dl>
            <dt>{t('guide.languages')}</dt>
            <dd>{guide.languages.map((l) => languageName(l)).join(t('common.listSep')) || '—'}</dd>
            <dt>{t('guide.experience')}</dt>
            <dd>{t('guide.years', { n: guide.yearsOfExperience })}</dd>
            <dt>{t('guide.cities')}</dt>
            <dd>{guide.cities.map((c) => c.name).join(t('common.listSep')) || '—'}</dd>
            <dt>{t('guide.sites')}</dt>
            <dd>{guide.sites?.map((s) => s.name).join(t('common.listSep')) || '—'}</dd>
          </dl>
          {guide.bio && (
            <p className="bio" dir="auto">
              {guide.bio}
            </p>
          )}
        </section>
      </div>

      <section className="card decision">
        <h3>{t('guide.decision')}</h3>
        {guide.rejectionReason && !pending && (
          <p>
            <b>{t('guide.reasonOnFile')}</b> <bdi>{guide.rejectionReason}</bdi>
          </p>
        )}

        {pending && mode === null && (
          <div className="row">
            <input
              placeholder={t('guide.notePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              className="btn primary"
              disabled={busy || expired}
              title={expired ? t('guide.licenseExpired') : ''}
              onClick={() => act(() => adminApi.approve(guide.id, note || undefined), t('guide.approved'))}
            >
              {t('guide.approve')}
            </button>
            <button className="btn danger" disabled={busy} onClick={() => setMode('reject')}>
              {t('guide.reject')}
            </button>
          </div>
        )}

        {guide.verificationStatus === 'APPROVED' && mode === null && (
          <button className="btn danger ghost" onClick={() => setMode('suspend')}>
            {t('guide.suspend')}
          </button>
        )}

        {mode && (
          <div className="stack">
            <label>
              {mode === 'reject' ? t('guide.rejectReason') : t('guide.suspendReason')}
              <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
            </label>
            {mode === 'reject' && (
              <div className="chips">
                {REJECT_TEMPLATES.map((key) => (
                  <button key={key} type="button" className="chip" onClick={() => setReason(t(key))}>
                    {t(key)}
                  </button>
                ))}
              </div>
            )}
            {reason.length > 0 && reason.trim().length < 5 && <p className="muted small">{t('guide.reasonTooShort')}</p>}
            <div className="row">
              <button
                className="btn danger"
                disabled={busy || reason.trim().length < 5}
                onClick={() =>
                  act(
                    () => (mode === 'reject' ? adminApi.reject(guide.id, reason) : adminApi.suspend(guide.id, reason)),
                    mode === 'reject' ? t('guide.rejected') : t('guide.suspended'),
                  )
                }
              >
                {mode === 'reject' ? t('guide.confirmReject') : t('guide.confirmSuspend')}
              </button>
              <button className="btn ghost" onClick={() => setMode(null)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
        {!pending && guide.verificationStatus !== 'APPROVED' && <p className="muted">{t('guide.noActions')}</p>}
      </section>

      <section className="card">
        <h3>{t('guide.history')}</h3>
        <ol className="timeline">
          {(guide.history ?? []).map((h) => (
            <li key={h.id}>
              <span className="muted small">{formatDate(h.createdAt)}</span>
              <div>
                <StatusBadge status={h.fromStatus} /> {dir === 'rtl' ? '←' : '→'} <StatusBadge status={h.toStatus} />
                {h.note && (
                  <div className="small" dir="auto">
                    {h.note}
                  </div>
                )}
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
