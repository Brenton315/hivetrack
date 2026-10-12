import { useNavigate } from 'react-router-dom';
import { useOverviewData } from '../../lib/hooks';
import { statusLabel } from '../../lib/strength';
import Logo from '../layout/Logo';

export default function HivesPage() {
  const { hivesWithStrength, loading } = useOverviewData();
  const navigate = useNavigate();

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Hives</h1>
          <span className="hq-subtitle">{hivesWithStrength.length} hives</span>
        </div>
      </header>

      <div className="hq-card" style={{ paddingBottom: 8 }}>
        <div className="hq-card-head">
          <h2>All hives</h2>
        </div>
        {loading ? (
          <p className="hq-empty">Loading...</p>
        ) : hivesWithStrength.length === 0 ? (
          <p className="hq-empty">No hives yet.</p>
        ) : (
          hivesWithStrength.map((h) => (
            <button
              key={h.id}
              className="hq-trow"
              style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) 48px 84px' }}
              onClick={() => navigate(`/hives/${h.id}`)}
            >
              <div className="hq-site-name">{h.name}</div>
              <div className="hq-muted">{h.site_name}</div>
              <div className="hq-pct">{h.strength != null ? `${h.strength}%` : '--'}</div>
              <div>
                {h.status ? (
                  <span className={`hq-status hq-st-${h.status}`}>
                    <span className={`hq-swatch ${h.status}`} />
                    {statusLabel(h.status)}
                  </span>
                ) : (
                  <span className="hq-muted">--</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
}
