import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOverviewData } from '../../lib/hooks';
import { statusLabel } from '../../lib/strength';
import { fmtDateShort } from '../../lib/format';
import SiteForm from './SiteForm';
import Logo from '../layout/Logo';

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`hq-status hq-st-${status}`}>
      <span className={`hq-swatch ${status}`} />
      {statusLabel(status as 'strong' | 'fair' | 'weak')}
    </span>
  );
}

export default function SiteList() {
  const { sites, loading, refetch } = useOverviewData();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Sites</h1>
          <span className="hq-subtitle">{sites.length} site{sites.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="hq-actions">
          <button type="button" className="hq-btn-primary hq-add-btn" onClick={() => setShowForm(true)} aria-label="Add site">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            <span className="hq-add-label">Add site</span>
          </button>
        </div>
      </header>

      <div className="hq-card" style={{ paddingBottom: 8 }}>
        <div className="hq-card-head">
          <h2>All sites</h2>
        </div>
        {loading ? (
          <p className="hq-empty">Loading...</p>
        ) : sites.length === 0 ? (
          <p className="hq-empty">
            No sites yet.{' '}
            <button className="hq-link" onClick={() => setShowForm(true)}>Add your first site</button>
          </p>
        ) : (
          <>
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
                  <span className="hq-site-flower">
                    <span className="hq-hives-inline">{s.hiveCount} hives</span>
                  </span>
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
          </>
        )}
      </div>

      {showForm && (
        <SiteForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refetch(); }}
        />
      )}
    </>
  );
}
