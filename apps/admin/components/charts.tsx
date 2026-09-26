'use client';

import { KeyboardEvent, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';

/* ------------------------------------------------------------------ */
/* Scales                                                               */
/* ------------------------------------------------------------------ */

/** Round tick values from 0 up to at least `max` (≈ `count` steps). `minStep` keeps counts whole. */
export function niceTicks(max: number, count = 4, minStep = 0): number[] {
  if (!(max > 0)) return [0, minStep || 1];
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(minStep, [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow);
  const ticks: number[] = [];
  for (let v = 0; v < max + step * 0.999; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks.length > 1 ? ticks : [0, step];
}

const useWidth = <T extends HTMLElement>(fallback = 640) => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth || fallback);
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);
  return [ref, width] as const;
};

/* ------------------------------------------------------------------ */
/* Daily activity: two aligned single-series charts, one shared hover. */
/* ------------------------------------------------------------------ */

export interface DailyPoint {
  date: string;
  bookings: number;
  gmvMinor: number;
}

const PLOT_H = 120;
const TOP = 8;
const X_AXIS = 24;
const Y_AXIS = 84; // room for compact money labels (Arabic ones are wider)
const END_PAD = 10;

/**
 * Bookings per day as columns and GMV per day as a line — two charts, not a
 * dual-axis one. Time runs start→end of the reading direction, so in Arabic the
 * newest day is on the left.
 */
export function DailyCharts({ daily, currency }: { daily: DailyPoint[]; currency: string }) {
  const { t, dir, formatDay, formatDayShort, formatMoney, formatMoneyCompact, formatNumber } = useI18n();
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [tipW, setTipW] = useState(170);

  const n = daily.length;
  const rtl = dir === 'rtl';
  const plotLeft = rtl ? END_PAD : Y_AXIS;
  const plotRight = width - (rtl ? Y_AXIS : END_PAD);
  const plotW = Math.max(1, plotRight - plotLeft);
  const band = plotW / Math.max(1, n);
  /** Center of day i; day 0 sits at the reading-direction start. */
  const cx = (i: number) => (rtl ? plotRight - (i + 0.5) * band : plotLeft + (i + 0.5) * band);
  const bandStart = (i: number) => (rtl ? plotRight - (i + 1) * band : plotLeft + i * band);

  // X ticks: always label the newest day, then every `step` days back.
  const maxTicks = Math.max(2, Math.floor(plotW / 78));
  const step = Math.max(1, Math.ceil(n / maxTicks));
  const xTicks = daily.map((_, i) => i).filter((i) => (n - 1 - i) % step === 0);

  useEffect(() => {
    if (tipRef.current) setTipW(tipRef.current.offsetWidth);
  }, [active]);

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!n) return;
    const visualRight = rtl ? -1 : 1;
    const cur = active ?? n - 1;
    let next = cur;
    if (e.key === 'ArrowRight') next = cur + visualRight;
    else if (e.key === 'ArrowLeft') next = cur - visualRight;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if (e.key === 'Escape') return setActive(null);
    else return;
    e.preventDefault();
    setActive(Math.min(n - 1, Math.max(0, next)));
  };

  const dayTitle = (d: DailyPoint) =>
    `${formatDay(d.date)}: ${d.bookings === 1 ? t('analytics.bookingsOne') : t('analytics.bookingsN', { n: formatNumber(d.bookings) })} · ${formatMoney(d.gmvMinor, currency)}`;

  const common = {
    width,
    n,
    band,
    cx,
    bandStart,
    plotLeft,
    plotRight,
    rtl,
    xTicks,
    active,
    setActive,
    onKey,
    dayTitle,
    daily,
    formatDayShort,
  };

  const d = active != null ? daily[active] : null;
  const ax = active != null ? cx(active) : 0;
  const tipLeft = ax > width / 2 ? ax - tipW - 12 : ax + 12;

  return (
    <div ref={wrapRef} className="chart" onPointerLeave={() => setActive(null)}>
      <p className="chart-sub">{t('analytics.dailyBookings')}</p>
      <SeriesChart
        {...common}
        label={t('analytics.dailyBookings')}
        values={daily.map((p) => p.bookings)}
        ticks={niceTicks(Math.max(...daily.map((p) => p.bookings), 0), 4, 1)}
        formatTick={(v) => formatNumber(v)}
        kind="bars"
      />
      <p className="chart-sub">{t('analytics.dailyGmv', { currency })}</p>
      <SeriesChart
        {...common}
        label={t('analytics.dailyGmv', { currency })}
        values={daily.map((p) => p.gmvMinor)}
        ticks={niceTicks(Math.max(...daily.map((p) => p.gmvMinor), 0), 4, 100)}
        formatTick={(v) => formatMoneyCompact(v, currency)}
        kind="line"
      />
      {d && (
        <div ref={tipRef} className="tooltip" style={{ left: Math.max(0, tipLeft), top: 24 }} role="status" aria-live="polite">
          <div className="tt-date">{formatDay(d.date)}</div>
          <div className="tt-row">
            <span className="key bar" aria-hidden />
            <b>{formatNumber(d.bookings)}</b>
            <span>{t('analytics.col.bookings')}</span>
          </div>
          <div className="tt-row">
            <span className="key line" aria-hidden />
            <b>{formatMoney(d.gmvMinor, currency)}</b>
            <span>{t('analytics.col.gmv')}</span>
          </div>
        </div>
      )}
      <p className="muted small">{t('analytics.chartHint')}</p>
    </div>
  );
}

function SeriesChart({
  width,
  n,
  band,
  cx,
  bandStart,
  plotLeft,
  plotRight,
  rtl,
  xTicks,
  active,
  setActive,
  onKey,
  dayTitle,
  daily,
  formatDayShort,
  label,
  values,
  ticks,
  formatTick,
  kind,
}: {
  width: number;
  n: number;
  band: number;
  cx: (i: number) => number;
  bandStart: (i: number) => number;
  plotLeft: number;
  plotRight: number;
  rtl: boolean;
  xTicks: number[];
  active: number | null;
  setActive: (i: number | null) => void;
  onKey: (e: KeyboardEvent<SVGSVGElement>) => void;
  dayTitle: (d: DailyPoint) => string;
  daily: DailyPoint[];
  formatDayShort: (s: string) => string;
  label: string;
  values: number[];
  ticks: number[];
  formatTick: (v: number) => string;
  kind: 'bars' | 'line';
}) {
  const top = ticks[ticks.length - 1] || 1;
  const baseY = TOP + PLOT_H;
  const y = (v: number) => baseY - (v / top) * PLOT_H;
  const height = TOP + PLOT_H + X_AXIS;
  // Y labels sit outside the plot on the reading-start side; "end" anchoring works in both directions.
  const yLabelX = rtl ? plotRight + 8 : plotLeft - 8;
  const barW = Math.min(24, band >= 3 ? band * 0.7 : band);
  const r = barW >= 8 ? 4 : barW >= 4 ? 2 : 0;

  const bar = (i: number, v: number) => {
    const x = cx(i) - barW / 2;
    const h = baseY - y(v);
    if (h <= 0) return null;
    const rr = Math.min(r, h);
    // Rounded data end, square at the baseline.
    return `M${x},${baseY}V${baseY - h + rr}Q${x},${baseY - h} ${x + rr},${baseY - h}H${x + barW - rr}Q${x + barW},${baseY - h} ${x + barW},${baseY - h + rr}V${baseY}Z`;
  };

  const linePath = values.map((v, i) => `${i ? 'L' : 'M'}${cx(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const areaPath = n ? `${linePath}L${cx(n - 1).toFixed(1)},${baseY}L${cx(0).toFixed(1)},${baseY}Z` : '';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      tabIndex={0}
      role="group"
      aria-label={label}
      onKeyDown={onKey}
      onBlur={() => setActive(null)}
    >
      {ticks.map((tv) => (
        <g key={tv}>
          <line className={tv === 0 ? 'baseline' : 'gridline'} x1={plotLeft} x2={plotRight} y1={y(tv)} y2={y(tv)} />
          <text className="tick" x={yLabelX} y={y(tv)} dy="0.32em" textAnchor="end">
            {formatTick(tv)}
          </text>
        </g>
      ))}
      {xTicks.map((i) => (
        <text key={i} className="tick" x={cx(i)} y={baseY + 16} textAnchor="middle">
          {formatDayShort(daily[i].date)}
        </text>
      ))}

      {kind === 'bars' &&
        values.map((v, i) => {
          const p = bar(i, v);
          return p ? <path key={i} className={`bar${active === i ? ' active' : ''}`} d={p} /> : null;
        })}

      {kind === 'line' && n > 0 && (
        <>
          <path className="area" d={areaPath} />
          <path className="line" d={linePath} />
          <circle className="dot" cx={cx(n - 1)} cy={y(values[n - 1])} r={4} />
        </>
      )}

      {active != null && (
        <>
          <line className="crosshair" x1={cx(active)} x2={cx(active)} y1={TOP} y2={baseY} />
          {kind === 'line' && <circle className="dot" cx={cx(active)} cy={y(values[active])} r={5} />}
        </>
      )}

      {/* Hit targets: a full-height band per day (bigger than the mark), each with a native title. */}
      {daily.map((d, i) => (
        <rect
          key={d.date}
          x={bandStart(i)}
          y={TOP}
          width={band}
          height={PLOT_H}
          fill="transparent"
          onPointerEnter={() => setActive(i)}
          onPointerDown={() => setActive(i)}
        >
          <title>{dayTitle(d)}</title>
        </rect>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal bar list                                                  */
/* ------------------------------------------------------------------ */

export interface BarItem {
  id: string;
  name: ReactNode;
  value: number;
  valueLabel: string;
  sub?: ReactNode;
  title: string;
}

/** Ranked list with a thin bar per row; bars grow from the inline start (right in Arabic). */
export function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ol className="barlist">
      {items.map((it) => (
        <li key={it.id} title={it.title}>
          <div className="bl-head">
            <span className="bl-name">{it.name}</span>
            <span className="bl-value">{it.valueLabel}</span>
          </div>
          <div className="bl-track" aria-hidden>
            <div className="bl-bar" style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
          {it.sub && <div className="muted small">{it.sub}</div>}
        </li>
      ))}
    </ol>
  );
}
