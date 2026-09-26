'use client';

import { useCallback, useEffect, useState } from 'react';
import { RequireAdmin } from '@/components/RequireAdmin';
import { StatusBadge } from '@/components/StatusBadge';
import { opsApi, SosAlert } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type Filter = 'open' | 'acknowledged' | 'all';

/** Tap-to-call link; the number stays left-to-right in Arabic text. */
function Phone({ value }: { value?: string | null }) {
  if (!value) return null;
  return (
    <a href={`tel:${value}`} dir="ltr" className="ltr">
      {value}
    </a>
  );
}

function SosBoard() {
  const [filter, setFilter] = useState<Filter>('open');
  const [alerts, setAlerts] = useState<SosAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const { t, label, formatDate, timeAgo } = useI18n();

  const load = useCallback(() => {
    opsApi.sos(filter).then(setAlerts).catch((e) => setError(e.message));
  }, [filter]);

  useEffect(() => {
    load();
    // Open alerts are time-critical: refresh every 15 seconds.
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);

  async function acknowledge(a: SosAlert) {
    setBusy(a.id);
    setError(null);
    try {
      await opsApi.acknowledge(a.id, notes[a.id]);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>{t('sos.title')}</h2>
          <p className="muted">{t('sos.subtitle')}</p>
        </div>
        <button className="btn ghost" onClick={load}>
          {t('common.refresh')}
        </button>
      </div>
      <div className="tabs">
        {(['open', 'acknowledged', 'all'] as const).map((f) => (
          <button key={f} className={f === filter ? 'tab active' : 'tab'} onClick={() => setFilter(f)}>
            {t(`sos.filter.${f}`)}
          </button>
        ))}
      </div>
      {error && <div className="alert bad">{error}</div>}
      {!alerts && !error && <div className="muted">{t('common.loading')}</div>}
      {alerts && alerts.length === 0 && <div className="empty card">{filter === 'open' ? t('sos.emptyOpen') : t('sos.emptyOther')}</div>}
      <div className="stack">
        {alerts?.map((a) => (
          <section key={a.id} className={`card sos ${a.acknowledgedAt ? '' : 'sos-open'}`}>
            <div className="row">
              <StatusBadge kind="sosStatus" tone={a.acknowledgedAt ? 'ok' : 'bad'} status={a.acknowledgedAt ? 'acknowledged' : 'open'} />
              <strong>{a.booking.packageTitle}</strong>
              <span className="muted small">
                {a.booking.city} · {t('sos.raisedBy', { who: label('role', a.raisedBy), ago: timeAgo(a.createdAt) })}
              </span>
            </div>
            {a.message && (
              <p className="sos-message" dir="auto">
                “{a.message}”
              </p>
            )}
            <div className="grid">
              <dl>
                <dt>{t('sos.tourist')}</dt>
                <dd>
                  {a.booking.tourist.name} <Phone value={a.booking.tourist.phone} />
                </dd>
                <dt>{t('sos.guide')}</dt>
                <dd>
                  {a.booking.guide.name} <Phone value={a.booking.guide.phone} />
                </dd>
                <dt>{t('sos.tour')}</dt>
                <dd>
                  {formatDate(a.booking.startAt)} · {t('sos.people', { n: a.booking.groupSize })} · {label('booking', a.booking.status)}
                </dd>
              </dl>
              <dl>
                <dt>{t('sos.location')}</dt>
                <dd>
                  {a.location ? (
                    <a href={a.location.mapsUrl} target="_blank" rel="noreferrer" dir="ltr" className="ltr">
                      {a.location.lat.toFixed(5)}, {a.location.lng.toFixed(5)} ↗
                    </a>
                  ) : (
                    <span className="muted">{t('sos.notShared')}</span>
                  )}
                </dd>
                <dt>{t('sos.raised')}</dt>
                <dd>{formatDate(a.createdAt)}</dd>
                {a.acknowledgedAt && (
                  <>
                    <dt>{t('sos.handled')}</dt>
                    <dd>
                      {formatDate(a.acknowledgedAt)}
                      {a.resolutionNote && (
                        <div className="muted small" dir="auto">
                          {a.resolutionNote}
                        </div>
                      )}
                    </dd>
                  </>
                )}
              </dl>
            </div>
            {!a.acknowledgedAt && (
              <div className="row">
                <input
                  placeholder={t('sos.notePlaceholder')}
                  value={notes[a.id] ?? ''}
                  onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                />
                <button className="btn primary" disabled={busy === a.id} onClick={() => acknowledge(a)}>
                  {busy === a.id ? t('sos.saving') : t('sos.acknowledge')}
                </button>
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

export default function SosPage() {
  return (
    <RequireAdmin>
      <SosBoard />
    </RequireAdmin>
  );
}
