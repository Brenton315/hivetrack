import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOverviewData } from '../../lib/hooks';
import { useOrg } from '../../lib/org';
import { statusLabel } from '../../lib/strength';
import { fmtDateShort, fmtMoney } from '../../lib/format';
import Logo from '../layout/Logo';
import BossView from './BossView';
import AskPanel from '../charts/AskPanel';

type ViewMode = 'boss' | 'operations';

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`hq-status hq-st-${status}`}>
      <span aria-hidden="true">●</span> {statusLabel(status as 'strong' | 'fair' | 'weak')}
    </span>
  );
}

function KpiStrip({ data }: { data: ReturnType<typeof useOverviewData> }) {
  const share = (n: number) => data.totalHives ? (n / data.totalHives) * 100 : 0;
  const avgCost = data.totalHives ? data.totalCosts / data.totalHives : 0;

  return (
    <div className="hq-card hq-kpis">
      <div className="hq-kpi">
        <span className="hq-kpi-label">Overall strength</span>
        <span className="hq-kpi-value">{data.overallStrength}%</span>
        <div className="hq-split" role="img" aria-label={`${data.counts.strong} strong, ${data.counts.fair} fair, ${data.counts.weak} weak`}>
          <div className="strong" style={{ width: `${share(data.counts.strong)}%` }} />
          <div className="fair" style={{ width: `${share(data.counts.fair)}%` }} />
          <div className="weak" style={{ width: `${share(data.counts.weak)}%` }} />
        </div>
        <div className="hq-legend">
          <span><span className="hq-swatch strong" />{data.counts.strong} strong</span>
          <span><span className="hq-swatch fair" />{data.counts.fair} fair</span>
          <span><span className="hq-swatch weak" />{data.counts.weak} weak</span>
        </div>
      </div>
      <div className="hq-kpi">
        <span className="hq-kpi-label">Total hives</span>
        <span className="hq-kpi-value">{data.totalHives}</span>
        <span className="hq-kpi-sub">Across {data.sites.length} sites</span>
      </div>
      <div className="hq-kpi">
        <span className="hq-kpi-label">Total costs</span>
        <span className="hq-kpi-value">{fmtMoney(data.totalCosts)}</span>
        <span className="hq-kpi-sub">{fmtMoney(avgCost)} per hive</span>
      </div>
    </div>
  );
}

function SitesTable({ sites }: { sites: ReturnType<typeof useOverviewData>['sites'] }) {
  const navigate = useNavigate();

  return (
    <div className="hq-card hq-sites-card">
      <div className="hq-card-head">
        <h2>Sites</h2>
        <button className="hq-link" onClick={() => navigate('/sites')}>View all</button>
      </div>
      <div className="hq-trow hq-cols-sites hq-thead">
        <div>Site</div>
        <div className="hq-num">Hives</div>
        <div>Last checked</div>
        <div>Strength</div>
        <div>Status</div>
      </div>
      {sites.map((s) => (
        <button key={s.id} className="hq-trow hq-cols-sites" onClick={() => navigate(`/sites/${s.id}`)}>
          <div className="hq-c-site">
            <span className="hq-site-name">{s.name}</span>
          </div>
          <div className="hq-c-hives hq-num">{s.hiveCount}</div>
          <div className="hq-c-checked">
            <span className={s.overdue ? 'hq-overdue' : 'hq-muted'}>
              {s.lastChecked ? fmtDateShort(s.lastChecked) : 'Never'}
            </span>
            {s.overdue && <span className="hq-overdue-badge">Overdue</span>}
          </div>
          <div className="hq-c-str">
            <div className="hq-track">
              <div className={`hq-bar ${s.status}`} style={{ width: `${s.strength}%` }} />
            </div>
            <span className="hq-pct">{s.strength}%</span>
          </div>
          <div className="hq-c-stat">
            <StatusBadge status={s.status} />
          </div>
        </button>
      ))}
      {sites.length === 0 && <p className="hq-empty">No sites yet. Add your first site.</p>}
    </div>
  );
}

function AttentionList({ hives }: { hives: ReturnType<typeof useOverviewData>['checkHives'] }) {
  const navigate = useNavigate();

  return (
    <div className="hq-card hq-check-card">
      <div className="hq-card-head"><h2>Hives needing attention</h2></div>
      {hives.length === 0 ? (
        <p className="hq-empty">All hives are strong.</p>
      ) : (
        hives.map((h) => (
          <button key={h.id} className="hq-trow hq-cols-check" onClick={() => navigate(`/hives/${h.id}`)}>
            <div className="hq-site-name">{h.name}</div>
            <div className="hq-muted">{h.site_name}</div>
            <div className="hq-pct">{h.strength}%</div>
            <div><StatusBadge status={h.status!} /></div>
          </button>
        ))
      )}
    </div>
  );
}

function OperationsView() {
  const data = useOverviewData();

  if (data.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', color: 'var(--muted)' }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <section className="hq-row" aria-label="Summary">
        <KpiStrip data={data} />
      </section>
      <section className="hq-row" aria-label="Sites">
        <SitesTable sites={data.sites} />
      </section>
      <section className="hq-row" aria-label="Attention">
        <AttentionList hives={data.checkHives} />
      </section>
      <section className="hq-row" aria-label="Ask AI">
        <div className="hq-card-head" style={{ padding: '0 0 4px' }}>
          <h2>Ask AI</h2>
        </div>
        <AskPanel />
      </section>
    </>
  );
}

export default function OverviewPage() {
  const { role } = useOrg();
  const defaultView: ViewMode = role === 'owner' ? 'boss' : 'operations';
  const [view, setView] = useState<ViewMode>(defaultView);

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Overview</h1>
        </div>
        <div className="hq-actions">
          <div className="hq-view-switch">
            <button
              className={`hq-view-btn ${view === 'boss' ? 'active' : ''}`}
              onClick={() => setView('boss')}
            >
              Boss
            </button>
            <button
              className={`hq-view-btn ${view === 'operations' ? 'active' : ''}`}
              onClick={() => setView('operations')}
            >
              Operations
            </button>
          </div>
        </div>
      </header>

      {view === 'boss' ? <BossView /> : <OperationsView />}
    </>
  );
}
