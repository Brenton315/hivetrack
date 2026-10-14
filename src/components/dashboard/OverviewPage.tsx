import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOverviewData, useAllEvents, useAuth } from '../../lib/hooks';
import { fmtDateShort } from '../../lib/format';
import { statusLabel } from '../../lib/strength';
import Logo from '../layout/Logo';
import DashboardMap from './DashboardMap';
import CalendarWidget from './CalendarWidget';

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`hq-status hq-st-${status}`}>
      <span aria-hidden="true">●</span> {statusLabel(status as 'strong' | 'fair' | 'weak')}
    </span>
  );
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const data = useOverviewData();
  const { events } = useAllEvents();

  const userName = user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? user?.email?.split('@')[0]
    ?? '';

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const recentVisits = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().slice(0, 10);
    return events.filter(e => e.event_date >= cutoff);
  }, [events]);

  const overdueCount = data.sites.filter(s => s.overdue).length;

  const upcomingTasks = useMemo(() => {
    const tasks: { id: string; label: string; detail: string; action: () => void }[] = [];

    for (const site of data.sites) {
      if (site.overdue) {
        tasks.push({
          id: `overdue-${site.id}`,
          label: `Inspect ${site.name}`,
          detail: site.lastChecked ? `Last checked ${fmtDateShort(site.lastChecked)}` : 'Never inspected',
          action: () => navigate(`/sites/${site.id}`),
        });
      }
    }

    for (const h of data.checkHives.slice(0, 5 - tasks.length)) {
      tasks.push({
        id: `weak-${h.id}`,
        label: `Check ${h.name}`,
        detail: `${h.strength}% strength — needs attention`,
        action: () => navigate(`/hives/${h.id}`),
      });
    }

    return tasks.slice(0, 5);
  }, [data.sites, data.checkHives, navigate]);

  if (data.loading) {
    return (
      <>
        <header className="hq-header">
          <div className="hq-brand"><Logo size={26} /><span className="hq-wordmark">hivehq</span></div>
          <div className="hq-title"><h1>Overview</h1></div>
        </header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', color: 'var(--muted)' }}>
          Loading...
        </div>
      </>
    );
  }

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand"><Logo size={26} /><span className="hq-wordmark">hivehq</span></div>
        <div className="hq-title">
          <h1>{greeting}, {userName}</h1>
        </div>
      </header>

      {/* Stats row */}
      <div className="hq-dash-stats">
        <div className="hq-dash-stat">
          <span className="hq-dash-stat-value">{data.totalHives}</span>
          <span className="hq-dash-stat-label">Total hives</span>
        </div>
        <div className="hq-dash-stat">
          <span className="hq-dash-stat-value">{data.sites.length}</span>
          <span className="hq-dash-stat-label">Sites</span>
        </div>
        <div className="hq-dash-stat">
          <span className="hq-dash-stat-value">{overdueCount}</span>
          <span className="hq-dash-stat-label">Inspections due</span>
        </div>
        <div className="hq-dash-stat">
          <span className="hq-dash-stat-value">{recentVisits.length}</span>
          <span className="hq-dash-stat-label">Events (7d)</span>
        </div>
      </div>

      {/* Main grid: map + calendar */}
      <div className="hq-dash-grid">
        <div className="hq-dash-main">
          <DashboardMap sites={data.sites} />
        </div>
        <div className="hq-dash-side">
          <CalendarWidget />
        </div>
      </div>

      {/* Tasks + recent */}
      <div className="hq-dash-grid">
        <div className="hq-dash-main">
          <div className="hq-card" style={{ paddingBottom: 8 }}>
            <div className="hq-card-head">
              <h2>Upcoming tasks</h2>
            </div>
            {upcomingTasks.length === 0 ? (
              <p className="hq-empty">All caught up. No urgent tasks.</p>
            ) : (
              upcomingTasks.map(t => (
                <button key={t.id} className="hq-trow" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }} onClick={t.action}>
                  <div>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{t.label}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>{t.detail}</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="hq-dash-side">
          <div className="hq-card" style={{ paddingBottom: 8 }}>
            <div className="hq-card-head">
              <h2>Sites overview</h2>
              <button className="hq-link" onClick={() => navigate('/sites')}>View all</button>
            </div>
            {data.sites.slice(0, 5).map(s => (
              <button key={s.id} className="hq-trow" style={{ gridTemplateColumns: 'minmax(0,1fr) 40px auto' }} onClick={() => navigate(`/sites/${s.id}`)}>
                <div>
                  <span className="hq-site-name">{s.name}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>{s.hiveCount} hives</span>
                </div>
                <span className="hq-pct">{s.strength}%</span>
                <StatusBadge status={s.status} />
              </button>
            ))}
            {data.sites.length === 0 && <p className="hq-empty">No sites yet.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
