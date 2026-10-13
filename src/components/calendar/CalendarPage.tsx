import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllEvents, useSites } from '../../lib/hooks';
import { fmtDate } from '../../lib/format';
import Logo from '../layout/Logo';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EVENT_COLOURS: Record<string, string> = {
  inspection: 'var(--brand)',
  feed: 'var(--strong)',
  treatment: '#e67e22',
  box_added: '#8e44ad',
  cost: 'var(--muted)',
  move: '#2980b9',
  visit: 'var(--brand)',
};

const EVENT_LABELS: Record<string, string> = {
  inspection: 'Inspection',
  feed: 'Feeding',
  treatment: 'Treatment',
  box_added: 'Box change',
  cost: 'Cost',
  move: 'Move',
  visit: 'Site visit',
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const { events, loading: eventsLoading } = useAllEvents();
  const { sites } = useSites();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const siteNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sites) map.set(s.id, s.name);
    return map;
  }, [sites]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events) {
      const key = e.event_date;
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => e.event_date >= todayStr)
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .slice(0, 10);
  }, [events, todayStr]);

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Calendar</h1>
          <span className="hq-subtitle">Tasks and site visits</span>
        </div>
      </header>

      <section className="hq-row" aria-label="Monthly calendar">
        <div className="hq-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button className="hq-btn-secondary" onClick={prevMonth} style={{ padding: '4px 12px' }}>&lsaquo;</button>
            <h2 style={{ margin: 0, fontSize: 16 }}>{MONTH_NAMES[viewMonth]} {viewYear}</h2>
            <button className="hq-btn-secondary" onClick={nextMonth} style={{ padding: '4px 12px' }}>&rsaquo;</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, fontSize: 12 }}>
            {DAY_LABELS.map(d => (
              <div key={d} style={{ textAlign: 'center', padding: '4px 0', fontWeight: 600, color: 'var(--muted)', fontSize: 11 }}>{d}</div>
            ))}

            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`pad-${i}`} style={{ minHeight: 48 }} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = eventsByDate.get(dateStr) ?? [];
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={day}
                  style={{
                    minHeight: 48,
                    padding: 3,
                    border: isToday ? '2px solid var(--brand)' : '1px solid var(--line)',
                    borderRadius: 4,
                    background: isToday ? 'color-mix(in srgb, var(--brand) 6%, transparent)' : undefined,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--brand)' : 'var(--ink)', marginBottom: 2 }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        title={`${EVENT_LABELS[e.event_type] ?? e.event_type} - ${siteNames.get(e.site_id) ?? ''}`}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: EVENT_COLOURS[e.event_type] ?? 'var(--muted)',
                          flexShrink: 0,
                        }}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span style={{ fontSize: 9, color: 'var(--muted)' }}>+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
            {Object.entries(EVENT_LABELS).map(([key, label]) => (
              <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: EVENT_COLOURS[key], display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="hq-row" aria-label="Upcoming">
        <div className="hq-card" style={{ paddingBottom: 8 }}>
          <div className="hq-card-head"><h2>Upcoming</h2></div>
          {eventsLoading ? (
            <p className="hq-empty">Loading...</p>
          ) : upcomingEvents.length === 0 ? (
            <p className="hq-empty">No upcoming events recorded.</p>
          ) : (
            upcomingEvents.map((e) => (
              <button
                key={e.id}
                className="hq-trow"
                style={{ gridTemplateColumns: '80px 90px minmax(0,1fr)', cursor: 'pointer' }}
                onClick={() => e.hive_id ? navigate(`/hives/${e.hive_id}`) : navigate(`/sites/${e.site_id}`)}
              >
                <div className="hq-muted" style={{ fontSize: 13 }}>{fmtDate(e.event_date)}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: EVENT_COLOURS[e.event_type] ?? 'var(--ink)' }}>
                  {EVENT_LABELS[e.event_type] ?? e.event_type}
                </div>
                <div className="hq-muted" style={{ fontSize: 13 }}>{siteNames.get(e.site_id) ?? ''}</div>
              </button>
            ))
          )}
        </div>
      </section>
    </>
  );
}
