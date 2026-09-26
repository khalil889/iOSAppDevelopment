'use client';

import { useCallback, useEffect, useState } from 'react';
import { RequireAdmin } from '@/components/RequireAdmin';
import { fmtDate, opsApi, SosAlert, timeAgo } from '@/lib/api';

type Filter = 'open' | 'acknowledged' | 'all';

function SosBoard() {
  const [filter, setFilter] = useState<Filter>('open');
  const [alerts, setAlerts] = useState<SosAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

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
          <h2>SOS alerts</h2>
          <p className="muted">Raised from the live-tour screen. Refreshes every 15 seconds.</p>
        </div>
        <button className="btn ghost" onClick={load}>
          Refresh
        </button>
      </div>
      <div className="tabs">
        {(['open', 'acknowledged', 'all'] as const).map((f) => (
          <button key={f} className={f === filter ? 'tab active' : 'tab'} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>
      {error && <div className="alert bad">{error}</div>}
      {!alerts && !error && <div className="muted">Loading…</div>}
      {alerts && alerts.length === 0 && <div className="empty card">{filter === 'open' ? 'No open alerts.' : 'Nothing here.'}</div>}
      <div className="stack">
        {alerts?.map((a) => (
          <section key={a.id} className={`card sos ${a.acknowledgedAt ? '' : 'sos-open'}`}>
            <div className="row">
              <span className={`badge ${a.acknowledgedAt ? 'ok' : 'bad'}`}>{a.acknowledgedAt ? 'acknowledged' : 'open'}</span>
              <strong>{a.booking.packageTitle}</strong>
              <span className="muted small">
                {a.booking.city} · raised by {a.raisedBy.toLowerCase()} {timeAgo(a.createdAt)}
              </span>
            </div>
            {a.message && <p className="sos-message">“{a.message}”</p>}
            <div className="grid">
              <dl>
                <dt>Tourist</dt>
                <dd>
                  {a.booking.tourist.name} {a.booking.tourist.phone && <a href={`tel:${a.booking.tourist.phone}`}>{a.booking.tourist.phone}</a>}
                </dd>
                <dt>Guide</dt>
                <dd>
                  {a.booking.guide.name} {a.booking.guide.phone && <a href={`tel:${a.booking.guide.phone}`}>{a.booking.guide.phone}</a>}
                </dd>
                <dt>Tour</dt>
                <dd>
                  {fmtDate(a.booking.startAt)} · {a.booking.groupSize} people · {a.booking.status.replace('_', ' ').toLowerCase()}
                </dd>
              </dl>
              <dl>
                <dt>Location</dt>
                <dd>
                  {a.location ? (
                    <a href={a.location.mapsUrl} target="_blank" rel="noreferrer">
                      {a.location.lat.toFixed(5)}, {a.location.lng.toFixed(5)} ↗
                    </a>
                  ) : (
                    <span className="muted">not shared</span>
                  )}
                </dd>
                <dt>Raised</dt>
                <dd>{fmtDate(a.createdAt)}</dd>
                {a.acknowledgedAt && (
                  <>
                    <dt>Handled</dt>
                    <dd>
                      {fmtDate(a.acknowledgedAt)}
                      {a.resolutionNote && <div className="muted small">{a.resolutionNote}</div>}
                    </dd>
                  </>
                )}
              </dl>
            </div>
            {!a.acknowledgedAt && (
              <div className="row">
                <input
                  placeholder="What did you do? (called tourist, sent help, false alarm…)"
                  value={notes[a.id] ?? ''}
                  onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                />
                <button className="btn primary" disabled={busy === a.id} onClick={() => acknowledge(a)}>
                  {busy === a.id ? 'Saving…' : 'Acknowledge'}
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
