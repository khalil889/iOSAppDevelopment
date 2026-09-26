'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BarList, DailyCharts } from '@/components/charts';
import { RequireAdmin } from '@/components/RequireAdmin';
import { StatusBadge } from '@/components/StatusBadge';
import { Analytics, AnalyticsDays, analyticsApi, VerificationStatus } from '@/lib/api';
import { MessageKey, useI18n } from '@/lib/i18n';

const PERIODS: AnalyticsDays[] = [7, 30, 90, 365];
const FUNNEL: VerificationStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
const PREFS_KEY = 'tg_admin_analytics';

/** Change vs the previous period. `upIsGood` picks the color; arrow + words carry the meaning too. */
function Delta({ current, previous, upIsGood = true }: { current: number; previous: number | undefined; upIsGood?: boolean }) {
  const { t, formatPercent } = useI18n();
  if (previous === undefined) return null;
  let tone: 'good' | 'bad' | 'flat' = 'flat';
  let text: string;
  let arrow = '='; // neutral in both reading directions
  if (current === previous) {
    text = t('analytics.noChange');
  } else if (previous === 0) {
    // No baseline: a percentage would be infinite.
    text = t('analytics.newVsZero');
    arrow = '↑';
    tone = upIsGood ? 'good' : 'bad';
  } else {
    const change = (current - previous) / Math.abs(previous);
    const up = change > 0;
    const pct = formatPercent(Math.abs(change), Math.abs(change) < 0.1 ? 1 : 0);
    text = up ? t('analytics.changeUp', { pct }) : t('analytics.changeDown', { pct });
    arrow = up ? '↑' : '↓';
    tone = up === upIsGood ? 'good' : 'bad';
  }
  return (
    <span className={`delta ${tone}`}>
      <span aria-hidden>{arrow}</span>
      <span>{text}</span>
      <span className="vs">{t('analytics.vsPrevious')}</span>
    </span>
  );
}

function Kpi({ label, value, help, delta }: { label: string; value: string; help?: string; delta?: React.ReactNode }) {
  return (
    <section className="card kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {delta}
      {help && <span className="kpi-help">{help}</span>}
    </section>
  );
}

function Overview() {
  const { t, locale, formatDay, formatMoney, formatNumber, formatPercent } = useI18n();
  const [days, setDays] = useState<AnalyticsDays>(30);
  const [currency, setCurrency] = useState('SAR');
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(false);

  // Remember the last period/currency for this admin (convenience only).
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? '{}');
      if (PERIODS.includes(saved.days)) setDays(saved.days);
      if (typeof saved.currency === 'string' && /^[A-Z]{3}$/.test(saved.currency)) setCurrency(saved.currency);
    } catch {
      // ignore
    }
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    analyticsApi
      .overview(days, currency)
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify({ days, currency }));
    } catch {
      // ignore
    }
  }, [days, currency]);
  useEffect(load, [load]);

  const currencies = Array.from(new Set([...(data?.currencies ?? []), currency])).sort();

  const toolbar = (
    <div className="toolbar">
      <div className="stack" style={{ gap: 4 }}>
        <span className="muted small">{t('analytics.period')}</span>
        <div className="segmented" role="group" aria-label={t('analytics.period')}>
          {PERIODS.map((p) => (
            <button key={p} aria-pressed={days === p} onClick={() => setDays(p)}>
              {t(`analytics.period.${p}` as MessageKey)}
            </button>
          ))}
        </div>
      </div>
      <label>
        {t('analytics.currency')}
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <div className="spacer" />
      <button className="btn small" onClick={load} disabled={loading}>
        {t('common.refresh')}
      </button>
    </div>
  );

  const head = (
    <div className="page-head">
      <div>
        <h2>{t('analytics.title')}</h2>
        <p className="muted">{t('analytics.subtitle')}</p>
      </div>
    </div>
  );

  if (!data) {
    return (
      <>
        {head}
        {toolbar}
        {error ? (
          <div className="alert bad row">
            <span>{error}</span>
            <div className="spacer" />
            <button className="btn small" onClick={load}>
              {t('analytics.retry')}
            </button>
          </div>
        ) : (
          <div className="card empty">{t('common.loading')}</div>
        )}
      </>
    );
  }

  const { bookings, money, users, reviews, safety } = data;
  const cur = data.range.currency;
  const m = (minor: number) => formatMoney(minor, cur);
  const bookingsLabel = (n: number) => (n === 1 ? t('analytics.bookingsOne') : t('analytics.bookingsN', { n: formatNumber(n) }));
  const hasDaily = data.daily.some((d) => d.bookings > 0 || d.gmvMinor > 0);
  const funnelTotal = FUNNEL.reduce((s, k) => s + (data.guideFunnel[k] ?? 0), 0);
  const extraFunnel = Object.keys(data.guideFunnel).filter((k) => !FUNNEL.includes(k as VerificationStatus)) as VerificationStatus[];

  return (
    <>
      {head}
      {toolbar}
      {error && <div className="alert bad">{error}</div>}

      <div className={loading ? 'refetching' : undefined} aria-busy={loading}>
        <div className="kpis">
          <Kpi
            label={t('analytics.kpi.gmv')}
            value={m(money.gmvMinor)}
            delta={<Delta current={money.gmvMinor} previous={money.previous?.gmvMinor} />}
            help={t('analytics.kpi.gmvHelp')}
          />
          <Kpi
            label={t('analytics.kpi.revenue')}
            value={m(money.platformRevenueMinor)}
            delta={<Delta current={money.platformRevenueMinor} previous={money.previous?.platformRevenueMinor} />}
            help={t('analytics.kpi.guidePayouts', { amount: m(money.guidePayoutsMinor) })}
          />
          <Kpi
            label={t('analytics.kpi.bookings')}
            value={formatNumber(bookings.created)}
            delta={<Delta current={bookings.created} previous={bookings.previous?.created} />}
            help={t('analytics.kpi.bookingsHelp', {
              completed: formatNumber(bookings.completed),
              cancelled: formatNumber(bookings.cancelled),
            })}
          />
          <Kpi
            label={t('analytics.kpi.conversion')}
            value={formatPercent(bookings.conversion)}
            delta={<Delta current={bookings.conversion} previous={bookings.previous?.conversion} />}
            help={t('analytics.kpi.conversionHelp', { paid: formatNumber(bookings.paid), created: formatNumber(bookings.created) })}
          />
          <Kpi
            label={t('analytics.kpi.refunds')}
            value={m(money.refundsMinor)}
            delta={<Delta current={money.refundsMinor} previous={money.previous?.refundsMinor} upIsGood={false} />}
          />
          <Kpi label={t('analytics.kpi.escrow')} value={m(money.inEscrowMinor)} help={t('analytics.kpi.escrowHelp')} />
          <Kpi label={t('analytics.kpi.newTourists')} value={formatNumber(users.newTourists)} />
          <Kpi label={t('analytics.kpi.newGuides')} value={formatNumber(users.newGuides)} />
          <Kpi
            label={t('analytics.kpi.rating')}
            value={reviews.count ? `★ ${formatNumber(reviews.avgRating, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}` : '—'}
            help={reviews.count ? t('analytics.kpi.ratingHelp', { n: formatNumber(reviews.count) }) : t('analytics.kpi.noReviews')}
          />
          <Kpi
            label={t('analytics.kpi.openDisputes')}
            value={formatNumber(safety.openDisputes)}
            help={t('analytics.kpi.openDisputesHelp', { n: formatNumber(safety.disputes) })}
          />
          <Kpi label={t('analytics.kpi.sos')} value={formatNumber(safety.sosAlerts)} help={t('analytics.kpi.sosHelp')} />
        </div>

        <section className="card chart-card">
          <div className="chart-head">
            <h3>{t('analytics.daily')}</h3>
            {hasDaily && (
              <button className="btn ghost small" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable}>
                {showTable ? t('common.hideTable') : t('common.showTable')}
              </button>
            )}
          </div>
          {hasDaily ? (
            <>
              {/* Re-mount on locale change so tick widths are measured for the new language. */}
              <DailyCharts key={locale} daily={data.daily} currency={cur} />
              {showTable && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('analytics.col.date')}</th>
                        <th className="num">{t('analytics.col.bookings')}</th>
                        <th className="num">{t('analytics.col.gmv')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.daily].reverse().map((d) => (
                        <tr key={d.date}>
                          <td>{formatDay(d.date)}</td>
                          <td className="num">{formatNumber(d.bookings)}</td>
                          <td className="num">{m(d.gmvMinor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="empty">{t('analytics.empty')}</div>
          )}
        </section>

        <div className="grid">
          <section className="card">
            <h3>{t('analytics.topCities')}</h3>
            <p className="muted small">{t('analytics.byBookings')}</p>
            {data.topCities.length ? (
              <BarList
                items={data.topCities.map((c) => {
                  const name = (locale === 'ar' && c.nameAr) || c.name;
                  const v = bookingsLabel(c.bookings);
                  return { id: c.id, name: <bdi>{name}</bdi>, value: c.bookings, valueLabel: v, sub: m(c.gmvMinor), title: `${name}: ${v} · ${m(c.gmvMinor)}` };
                })}
              />
            ) : (
              <p className="muted">{t('analytics.noneYet')}</p>
            )}
          </section>
          <section className="card">
            <h3>{t('analytics.topGuides')}</h3>
            <p className="muted small">{t('analytics.byBookings')}</p>
            {data.topGuides.length ? (
              <BarList
                items={data.topGuides.map((g) => {
                  const v = bookingsLabel(g.bookings);
                  const rating = g.rating ? `★ ${formatNumber(g.rating, { maximumFractionDigits: 2 })}` : '';
                  return {
                    id: g.id,
                    name: (
                      <Link href={`/guides/${g.id}`}>
                        <bdi>{g.name}</bdi>
                      </Link>
                    ),
                    value: g.bookings,
                    valueLabel: v,
                    sub: [m(g.gmvMinor), rating].filter(Boolean).join(' · '),
                    title: `${g.name}: ${v} · ${m(g.gmvMinor)}`,
                  };
                })}
              />
            ) : (
              <p className="muted">{t('analytics.noneYet')}</p>
            )}
          </section>
        </div>

        <section className="card">
          <h3>
            {t('analytics.funnel')} <span className="count">{formatNumber(funnelTotal)}</span>
          </h3>
          <p className="muted small">{t('analytics.funnelHelp')}</p>
          <div className="funnel">
            {[...FUNNEL, ...extraFunnel].map((s) => (
              <Link key={s} href={`/guides?status=${s}`} className="funnel-step" style={{ color: 'inherit' }}>
                <StatusBadge status={s} />
                <span className="kpi-value">{formatNumber(data.guideFunnel[s] ?? 0)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default function AnalyticsPage() {
  return (
    <RequireAdmin>
      <Overview />
    </RequireAdmin>
  );
}
