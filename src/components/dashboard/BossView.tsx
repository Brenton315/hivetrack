import { useNavigate } from 'react-router-dom';
import { useOverviewData } from '../../lib/hooks';
import { fmtMoney } from '../../lib/format';

export default function BossView() {
  const data = useOverviewData();
  const navigate = useNavigate();

  if (data.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', color: 'var(--muted)' }}>
        Loading...
      </div>
    );
  }

  const overdueCount = data.sites.filter(s => s.overdue).length;
  const avgCost = data.totalHives ? data.totalCosts / data.totalHives : 0;

  const tiles = [
    { label: 'Total hives', value: String(data.totalHives), sub: `${data.sites.length} sites`, color: 'var(--brand)' },
    { label: 'Overall strength', value: `${data.overallStrength}%`, sub: `${data.counts.strong} strong, ${data.counts.fair} fair, ${data.counts.weak} weak`, color: data.overallStrength >= 70 ? 'var(--strong)' : data.overallStrength >= 50 ? 'var(--fair)' : 'var(--weak-text)' },
    { label: 'Sites overdue', value: String(overdueCount), sub: overdueCount === 0 ? 'All up to date' : 'Past 21-day window', color: overdueCount > 0 ? 'var(--weak-text)' : 'var(--strong)' },
    { label: 'Revenue', value: fmtMoney(data.totalRevenue), sub: 'Honey sales', color: 'var(--strong)' },
    { label: 'Costs', value: fmtMoney(data.totalCosts), sub: `${fmtMoney(avgCost)} per hive`, color: 'var(--muted)' },
    { label: 'Need attention', value: String(data.checkHives.length), sub: data.checkHives.length === 0 ? 'All hives strong' : 'Fair or weak hives', color: data.checkHives.length > 0 ? 'var(--fair)' : 'var(--strong)' },
  ];

  return (
    <>
      <div className="hq-boss-grid">
        {tiles.map((t) => (
          <div key={t.label} className="hq-card hq-boss-tile">
            <span className="hq-kpi-label">{t.label}</span>
            <span className="hq-kpi-value" style={{ color: t.color }}>{t.value}</span>
            <span className="hq-kpi-sub">{t.sub}</span>
          </div>
        ))}
      </div>

      {overdueCount > 0 && (
        <div className="hq-card" style={{ paddingBottom: 8, marginTop: 16 }}>
          <div className="hq-card-head"><h2>Overdue sites</h2></div>
          {data.sites.filter(s => s.overdue).map(s => (
            <button key={s.id} className="hq-trow" style={{ gridTemplateColumns: 'minmax(0,1fr) 60px 80px' }} onClick={() => navigate(`/sites/${s.id}`)}>
              <div className="hq-site-name">{s.name}</div>
              <div className="hq-num" style={{ fontSize: 13 }}>{s.hiveCount} hives</div>
              <div className="hq-overdue" style={{ fontSize: 13 }}>{s.lastChecked ? `${Math.floor((Date.now() - new Date(s.lastChecked).getTime()) / 86400000)}d ago` : 'Never'}</div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
