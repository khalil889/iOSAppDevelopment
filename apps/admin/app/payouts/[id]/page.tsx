'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RequireAdmin } from '@/components/RequireAdmin';
import { StatusBadge } from '@/components/StatusBadge';
import { Payout, PayoutRunDetail, payoutsApi, SkippedGuide, skippedKey } from '@/lib/api';
import { MessageKey, useI18n } from '@/lib/i18n';

/** `returned`: a PAID transfer the bank sent back (same endpoint as failed). */
type Action = { payout: Payout; kind: 'paid' | 'failed' | 'returned' };

const MIN = { paid: 3, failed: 5, returned: 5 } as const;

const COPY: Record<Action['kind'], { label: MessageKey; button: MessageKey; hint: MessageKey }> = {
  paid: { label: 'run.reference', button: 'run.markPaid', hint: 'run.referenceHint' },
  failed: { label: 'run.failReason', button: 'run.markFailed', hint: 'run.failHint' },
  returned: { label: 'run.returnReason', button: 'run.markReturned', hint: 'run.returnHint' },
};

function Run() {
  const { id } = useParams<{ id: string }>();
  const { t, dir, label, formatDate, formatMoney, formatNumber } = useI18n();
  const [run, setRun] = useState<PayoutRunDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<SkippedGuide[]>([]);
  const [action, setAction] = useState<Action | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDownload, setConfirmDownload] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(() => {
    payoutsApi.run(id).then(setRun).catch((e) => setError((e as Error).message));
  }, [id]);
  useEffect(load, [load]);

  // Arriving straight from "Create payout run": read the one-off flags, then drop them from the URL.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('created')) {
      setNotice(t('run.createdNotice'));
      window.history.replaceState(null, '', window.location.pathname);
    }
    try {
      const raw = window.sessionStorage.getItem(skippedKey(id));
      if (raw) setSkipped(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- first mount only

  async function submit() {
    if (!action) return;
    setBusy(true);
    setError(null);
    try {
      if (action.kind === 'paid') await payoutsApi.markPaid(action.payout.id, text.trim());
      else await payoutsApi.markFailed(action.payout.id, text.trim());
      setNotice(t(action.kind === 'paid' ? 'run.paidNotice' : action.kind === 'returned' ? 'run.returnedNotice' : 'run.failedNotice'));
      setAction(null);
      setText('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      load();
    }
  }

  async function download() {
    if (!run) return;
    setDownloading(true);
    setError(null);
    try {
      const date = new Date().toISOString().slice(0, 10);
      await payoutsApi.downloadCsv(run.id, `payouts-${run.currency}-${date}.csv`);
      setConfirmDownload(false);
    } catch (e) {
      setError((e as Error).message);
      setConfirmDownload(false);
    } finally {
      setDownloading(false);
    }
  }

  if (!run) return <div className="muted">{error ?? t('common.loading')}</div>;

  const count = (s: Payout['status']) => run.payouts.filter((p) => p.status === s).length;
  const pending = count('PENDING');
  const paidAmount = run.payouts.filter((p) => p.status === 'PAID').reduce((n, p) => n + p.amountMinor, 0);
  const exports = run.exportCount ?? 0;
  const valid = text.trim().length >= (action ? MIN[action.kind] : 0) && text.trim().length <= 200;

  return (
    <>
      <Link href="/payouts" className="muted small">
        {t('run.back')}
      </Link>
      <div className="page-head">
        <div>
          <h2>{t('run.title', { currency: run.currency })}</h2>
          <span className="muted small mono ltr" dir="ltr">
            {run.id}
          </span>
        </div>
        <button
          className="btn primary"
          disabled={!pending || downloading}
          title={pending ? '' : t('run.downloadNone')}
          onClick={() => setConfirmDownload(true)}
        >
          ⤓ {t('run.download')}
        </button>
      </div>

      {notice && <div className="alert ok">{notice}</div>}
      {skipped.length > 0 && (
        <div className="alert neutral">
          <div className="row">
            <b>{t('run.skippedTitle', { count: formatNumber(skipped.length) })}</b>
            <div className="spacer" />
            <button
              className="btn ghost small"
              onClick={() => {
                setSkipped([]);
                try {
                  window.sessionStorage.removeItem(skippedKey(id));
                } catch {
                  // ignore
                }
              }}
            >
              ✕
            </button>
          </div>
          <ul style={{ margin: '6px 0 0', paddingInlineStart: 18 }}>
            {skipped.map((s) => (
              <li key={s.guideId}>
                <Link href={`/guides/${s.guideId}`}>
                  <bdi>{s.guideName}</bdi>
                </Link>
                {s.amountMinor != null && <> · {formatMoney(s.amountMinor, run.currency)}</>} —{' '}
                <span className="badge warn nocap">{label('skipReason', s.reason)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <div className="alert bad">{error}</div>}

      <div className="summary">
        <section className="card kpi">
          <span className="kpi-label">{t('run.total')}</span>
          <span className="kpi-value">{formatMoney(run.totalMinor, run.currency)}</span>
        </section>
        <section className="card kpi">
          <span className="kpi-label">{t('run.count')}</span>
          <span className="kpi-value">{formatNumber(run.payoutCount)}</span>
          <span className="kpi-help">
            {t('run.progressValue', { paid: formatNumber(count('PAID')), pending: formatNumber(pending), failed: formatNumber(count('FAILED')) })}
          </span>
        </section>
        <section className="card kpi">
          <span className="kpi-label">{t('run.paidAmount')}</span>
          <span className="kpi-value">{formatMoney(paidAmount, run.currency)}</span>
        </section>
        <section className="card kpi">
          <span className="kpi-label">{t('run.created')}</span>
          <span className="kpi-value" style={{ fontSize: 16 }}>
            {formatDate(run.createdAt)}
          </span>
        </section>
        <section className="card kpi">
          <span className="kpi-label">{t('run.exports')}</span>
          {exports > 0 ? (
            <>
              <span className="kpi-value">{formatNumber(exports)}</span>
              <span className="kpi-help">{formatDate(run.lastExportedAt)}</span>
            </>
          ) : (
            <span className="kpi-help">{t('run.neverExported')}</span>
          )}
        </section>
      </div>

      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>{t('payouts.col.guide')}</th>
              <th>{t('payouts.col.holder')}</th>
              <th>{t('payouts.col.iban')}</th>
              <th className="num">{t('payouts.col.amount')}</th>
              <th className="num">{t('payouts.col.payments')}</th>
              <th>{t('payouts.col.status')}</th>
              <th>{t('payouts.col.note')}</th>
              <th>{t('payouts.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {run.payouts.map((p) => (
              <Fragment key={p.id}>
                <tr>
                  <td>
                    <Link href={`/guides/${p.guideId}`}>
                      <bdi>{p.guide?.name ?? '—'}</bdi>
                    </Link>
                    {p.guide?.phone && (
                      <div className="muted small ltr" dir="ltr">
                        {p.guide.phone}
                      </div>
                    )}
                  </td>
                  <td>
                    <bdi>{p.holderName}</bdi>
                  </td>
                  <td>
                    <span className="mono ltr" dir="ltr">
                      {p.ibanMasked}
                    </span>
                  </td>
                  <td className="num">{formatMoney(p.amountMinor, p.currency)}</td>
                  <td className="num">{formatNumber(p.paymentCount)}</td>
                  <td>
                    <StatusBadge kind="payoutStatus" status={p.status} />
                  </td>
                  <td className="small">
                    {p.note && (
                      <div className={p.status === 'PAID' ? 'mono ltr' : undefined} dir={p.status === 'PAID' ? 'ltr' : 'auto'}>
                        {p.note}
                      </div>
                    )}
                    {p.paidAt && <div className="muted">{t('run.paidOn', { date: formatDate(p.paidAt) })}</div>}
                    {!p.note && !p.paidAt && <span className="muted">—</span>}
                  </td>
                  <td>
                    {p.status === 'PENDING' && (
                      <div className="row" style={{ flexWrap: 'nowrap' }}>
                        <button
                          className="btn small primary"
                          disabled={busy}
                          onClick={() => {
                            setAction({ payout: p, kind: 'paid' });
                            setText('');
                          }}
                        >
                          {t('run.markPaid')}
                        </button>
                        <button
                          className="btn small danger ghost"
                          disabled={busy}
                          onClick={() => {
                            setAction({ payout: p, kind: 'failed' });
                            setText('');
                          }}
                        >
                          {t('run.markFailed')}
                        </button>
                      </div>
                    )}
                    {p.status === 'PAID' && (
                      <button
                        className="btn small danger ghost"
                        disabled={busy}
                        onClick={() => {
                          setAction({ payout: p, kind: 'returned' });
                          setText('');
                        }}
                      >
                        {t('run.markReturned')}
                      </button>
                    )}
                  </td>
                </tr>
                {action?.payout.id === p.id && (
                  <tr className="row-form">
                    <td colSpan={8}>
                      <form
                        className="stack"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (valid && !busy) submit();
                        }}
                      >
                        <label>
                          {t(COPY[action.kind].label)}
                          <div className="row">
                            <input
                              autoFocus
                              value={text}
                              maxLength={200}
                              dir={action.kind === 'paid' ? 'ltr' : 'auto'}
                              onChange={(e) => setText(e.target.value)}
                            />
                            <button className={`btn ${action.kind === 'paid' ? 'primary' : 'danger'}`} disabled={!valid || busy}>
                              {busy ? t('run.saving') : t(COPY[action.kind].button)}
                            </button>
                            <button type="button" className="btn ghost" onClick={() => setAction(null)} disabled={busy}>
                              {t('common.cancel')}
                            </button>
                          </div>
                        </label>
                        <span className="muted small">
                          {t(COPY[action.kind].hint)} ·{' '}
                          {formatMoney(p.amountMinor, p.currency)} {dir === 'rtl' ? '←' : '→'} <bdi>{p.holderName}</bdi>
                        </span>
                      </form>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmDownload}
        title={t('run.downloadTitle')}
        confirmLabel={downloading ? t('run.downloading') : t('run.download')}
        busy={downloading}
        onCancel={() => setConfirmDownload(false)}
        tone={exports > 0 ? 'danger' : 'primary'}
        onConfirm={download}
      >
        <p>{t('run.downloadBody')}</p>
        {exports > 0 && (
          <p className="alert bad" role="alert">
            {t('run.downloadAgainWarn', { n: formatNumber(exports), date: formatDate(run.lastExportedAt) })}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}

export default function PayoutRunPage() {
  return (
    <RequireAdmin>
      <Run />
    </RequireAdmin>
  );
}
