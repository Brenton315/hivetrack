import { useHarvests, useSites, useHives } from '../../lib/hooks';
import Logo from '../layout/Logo';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
  const p = iso.split('-');
  return `${Number(p[2])} ${MONTHS[Number(p[1]) - 1]} ${p[0]}`;
}

export default function HarvestsPage() {
  const { harvests, loading } = useHarvests();
  const { sites } = useSites();
  const { hives } = useHives();

  const siteMap = new Map(sites.map(s => [s.id, s.name]));
  const hiveMap = new Map(hives.map(h => [h.id, h.name]));

  const totalKg = harvests.reduce((sum, h) => sum + h.kg, 0);

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Harvests</h1>
          <span className="hq-subtitle">{harvests.length} harvests, {totalKg.toFixed(1)} kg total</span>
        </div>
      </header>

      <div className="hq-card" style={{ paddingBottom: 8 }}>
        <div className="hq-card-head">
          <h2>All harvests</h2>
        </div>
        {loading ? (
          <p className="hq-empty">Loading...</p>
        ) : harvests.length === 0 ? (
          <p className="hq-empty">No harvests recorded yet.</p>
        ) : (
          harvests.map((h) => (
            <div key={h.id} className="hq-trow" style={{ gridTemplateColumns: '100px minmax(0,1fr) 70px 80px', cursor: 'default' }}>
              <div className="hq-muted">{formatDate(h.harvest_date)}</div>
              <div>
                <span className="hq-site-name">{siteMap.get(h.site_id) ?? 'Unknown site'}</span>
                {h.hive_id && <span className="hq-site-flower">{hiveMap.get(h.hive_id) ?? ''}</span>}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 500 }}>{h.kg} kg</div>
              <div className="hq-muted" style={{ textAlign: 'right' }}>{h.honey_type ?? '--'}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
