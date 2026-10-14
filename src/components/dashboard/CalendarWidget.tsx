import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllEvents, useSites } from '../../lib/hooks';
import { fmtDate } from '../../lib/format';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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

export default function CalendarWidget() {
  const navigate = useNavigate();
  const { events } = useAllEvents();
  const { sites } = useSites();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const siteNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sites) map.set(s.id, s.name);
    return map;
  }, [sites]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events) {
      const arr = map.get(e.event_date) ?? [];
      arr.push(e);
      map.set(e.event_date, arr);
    }
    return map;
  }, [events]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = (() => { const d = new Date(viewYear, viewMonth, 1).getDay(); return d === 0 ? 6 : d - 1; })();

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  };

  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

  return (
    <div className="hq-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', fontSize: 16, padding: '4px 8px' }}>&lsaquo;</button>
        <h2 style={{ fontSize: 14, margin: 0 }}>{MONTH_NAMES[viewMonth]} {viewYear}</h2>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', fontSize: 16, padding: '4px 8px' }}>&rsaquo;</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, fontSize: 11 }}>
        {DAY_LABELS.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '2px 0', fontWeight: 600, color: 'var(--muted)' }}>{d}</div>
        ))}

        {Array.from({ length: firstDow }).map((_, i) => <div key={`p-${i}`} />)}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = eventsByDate.get(dateStr) ?? [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              style={{
                padding: 2,
                border: isSelected ? '2px solid var(--brand)' : isToday ? '2px solid var(--accent)' : '1px solid transparent',
                borderRadius: 4,
                background: isSelected ? 'color-mix(in srgb, var(--brand) 10%, transparent)' : 'none',
                cursor: 'pointer',
                minHeight: 28,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                color: 'var(--ink)',
                font: 'inherit',
              }}
            >
              <span style={{ fontWeight: isToday ? 700 : 400, fontSize: 11 }}>{day}</span>
              {dayEvents.length > 0 && (
                <div style={{ display: 'flex', gap: 1 }}>
                  {dayEvents.slice(0, 3).map(e => (
                    <span key={e.id} style={{ width: 4, height: 4, borderRadius: '50%', background: EVENT_COLOURS[e.event_type] ?? 'var(--muted)' }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
            {fmtDate(selectedDate)}
          </div>
          {selectedEvents.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>No events on this day.</p>
          ) : (
            selectedEvents.map(e => (
              <button
                key={e.id}
                onClick={() => e.hive_id ? navigate(`/hives/${e.hive_id}`) : navigate(`/sites/${e.site_id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 0', background: 'none', border: 'none',
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                  color: 'var(--ink)', font: 'inherit',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: EVENT_COLOURS[e.event_type], flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{EVENT_LABELS[e.event_type] ?? e.event_type}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>{siteNames.get(e.site_id) ?? ''}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
