'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RequireAdmin } from '@/components/RequireAdmin';
import { OwedRow, PayoutRun, payoutsApi, SkippedGuide, skippedKey } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

interface Group {
  currency: string;
  rows: OwedRow[];
  total: number;
  payable: OwedRow[];
  payableTotal: number;
  skipped: OwedRow[];
  skippedTotal: number;
}

const sum = (rows: OwedRow[]) => rows.reduce((n, r) => n + r.amountMinor, 0);

function groupByCurrency(rows: OwedRow[]): Group[] {
  const map = new Map<string, OwedRow[]>();
  for (const r of rows) map.set(r.currency, [...(map.get(r.currency) ?? []), r]);
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, list]) => {
      const payable = list.filter((r) => r.ibanMasked);
      const skipped = list.filter((r) => !r.ibanMasked);
      return { currency, rows: list, total: sum(list), payable, payableTotal: sum(payable), skipped, skippedTotal: sum(skipped) };
    });
}

function Payouts() {
  const router = useRouter();
  const { t, formatDate, formatMoney, formatNumber } = useI18n();
  const [owed, setOwed] = useState<OwedRow[] | null>(null);
  const [runs, setRuns] = useState<PayoutRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Group | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    Promise.all([payoutsApi.owed(), payoutsApi.runs()])
      .then(([o, r]) => {
        setOwed(o);
        setRuns(r);
      })
      .catch((e) => setError((e as Error).message));
  }, []);
  useEffect(load, [load]);

  async function createRun(g: Group) {
    setBusy(true);
    setError(null);
    try {
      const res = await payoutsApi.createRun(g.currency);
      // Older API builds only return ids; treat those as "no account".
      const skipped = res.skipped ?? res.skippedGuideIds.map((guideId) => ({ guideId, reason: 'NO_ACCOUNT' as const }));
      const names = new Map(g.rows.map((r) => [r.guideId, r]));
      const detail: SkippedGuide[] = skipped.map((s) => ({
        ...s,
        guideName: names.get(s.guideId)?.guideName ?? s.guideId,
        amountMinor: names.get(s.guideId)?.amountMinor ?? null,
      }));
      try {
        window.sessionStorage.setItem(skippedKey(res.run.id), JSON.stringify(detail));
      } catch {
        // Storage blocked: the run page just won't list who was skipped.
      }
      router.push(`/payouts/${res.run.id}?created=1`);
    } catch (e) {
      setError((e as Error).message);
      setConfirming(null);
      load();
    } finally {
      setBusy(false);
    }
  }

  const groups = owed ? groupByCurrency(owed) : [];

  return (
    <>
      <div className="page-head">
        <div>
          <h2>{t('payouts.title')}</h2>
          <p className="muted">{t('payouts.subtitle')}</p>
        </div>
        <button className="btn small" onClick={load}>
          {t('common.refresh')}
        </button>
      </div>
      {error && <div className="alert bad">{error}</div>}

      <h3 className="section-title">{t('payouts.owed')}</h3>
      {!owed ? (
        !error && <div className="card empty">{t('common.loading')}</div>
      ) : groups.length === 0 ? (
        <div className="card empty">{t('payouts.nothingOwed')}</div>
      ) : (
        groups.map((g) => (
          <section key={g.currency} className="card" style={{ marginBottom: 12 }}>
            <div className="group-head">
              <div>
                <h3>
                  <span className="ltr">{g.currency}</span>
                  <span className="muted small" style={{ fontWeight: 400 }}>
                    {t('payouts.groupSummary', { total: formatMoney(g.total, g.currency), count: formatNumber(g.rows.length) })}
                  </span>
                </h3>
                {g.skipped.length > 0 && <p className="muted small" style={{ margin: 0 }}>{t('payouts.noAccountHint')}</p>}
              </div>
              <button
                className="btn primary"
                disabled={!g.payable.length || busy}
                title={g.payable.length ? '' : t('payouts.nonePayable')}
                onClick={() => setConfirming(g)}
              >
                {t('payouts.createRun')}
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('payouts.col.guide')}</th>
                    <th>{t('payouts.col.holder')}</th>
                    <th>{t('payouts.col.iban')}</th>
                    <th className="num">{t('payouts.col.payments')}</th>
                    <th>{t('payouts.col.oldest')}</th>
                    <th className="num">{t('payouts.col.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => (
                    <tr key={r.guideId}>
                      <td>
                        <Link href={`/guides/${r.guideId}`}>
                          <bdi>{r.guideName}</bdi>
                        </Link>
                      </td>
                      <td>{r.holderName ? <bdi>{r.holderName}</bdi> : <span className="muted">—</span>}</td>
                      <td>
                        {r.ibanMasked ? (
                          <span className="mono ltr" dir="ltr">
                            {r.ibanMasked}
                          </span>
                        ) : (
                          <span className="badge warn nocap">{t('payouts.noAccount')}</span>
                        )}
                      </td>
                      <td className="num">{formatNumber(r.paymentCount)}</td>
                      <td className="small muted">{formatDate(r.oldestReleasedAt)}</td>
                      <td className="num">{formatMoney(r.amountMinor, r.currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>{t('common.total')}</td>
                    <td className="num">{formatNumber(g.rows.reduce((n, r) => n + r.paymentCount, 0))}</td>
                    <td />
                    <td className="num">{formatMoney(g.total, g.currency)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        ))
      )}

      <h3 className="section-title">{t('payouts.runs')}</h3>
      {!runs ? (
        !error && <div className="card empty">{t('common.loading')}</div>
      ) : runs.length === 0 ? (
        <div className="card empty">{t('payouts.noRuns')}</div>
      ) : (
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th>{t('payouts.col.created')}</th>
                <th>{t('payouts.col.currency')}</th>
                <th className="num">{t('payouts.col.count')}</th>
                <th className="num">{t('payouts.col.total')}</th>
                <th>{t('run.exports')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="clickable" onClick={() => router.push(`/payouts/${r.id}`)}>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>
                    <span className="ltr">{r.currency}</span>
                  </td>
                  <td className="num">{formatNumber(r.payoutCount)}</td>
                  <td className="num">{formatMoney(r.totalMinor, r.currency)}</td>
                  <td className="small">
                    {r.exportCount ? (
                      t('run.exportsValue', { n: formatNumber(r.exportCount), date: formatDate(r.lastExportedAt) })
                    ) : (
                      <span className="muted">{t('run.neverExported')}</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'end' }}>
                    <Link href={`/payouts/${r.id}`} onClick={(e) => e.stopPropagation()}>
                      {t('payouts.open')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirming !== null}
        title={confirming ? t('payouts.confirmRunTitle', { currency: confirming.currency }) : ''}
        confirmLabel={busy ? t('payouts.creating') : t('payouts.createRun')}
        busy={busy}
        onCancel={() => setConfirming(null)}
        onConfirm={() => confirming && createRun(confirming)}
      >
        {confirming && (
          <>
            <p>
              {t('payouts.confirmRunBody', {
                count: formatNumber(confirming.payable.length),
                total: formatMoney(confirming.payableTotal, confirming.currency),
              })}
            </p>
            {confirming.skipped.length > 0 && (
              <p className="alert neutral small">
                {t('payouts.confirmRunSkipped', {
                  count: formatNumber(confirming.skipped.length),
                  amount: formatMoney(confirming.skippedTotal, confirming.currency),
                })}
              </p>
            )}
            <p className="muted small">{t('payouts.coolingHint')}</p>
          </>
        )}
      </ConfirmDialog>
    </>
  );
}

export default function PayoutsPage() {
  return (
    <RequireAdmin>
      <Payouts />
    </RequireAdmin>
  );
}
