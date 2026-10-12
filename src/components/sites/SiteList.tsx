import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSites } from '../../lib/hooks';
import SiteForm from './SiteForm';
import Logo from '../layout/Logo';

export default function SiteList() {
  const { sites, loading, refetch } = useSites();
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
          <span className="hq-subtitle">{sites.length} sites</span>
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
          sites.map((site) => (
            <button key={site.id} className="hq-trow" style={{ gridTemplateColumns: 'minmax(0,1fr) 80px' }} onClick={() => navigate(`/sites/${site.id}`)}>
              <div>
                <span className="hq-site-name">{site.name}</span>
                <span className="hq-site-flower">
                  {site.hive_count} hives{site.main_flowering ? ` · ${site.main_flowering}` : ''}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <svg className="icon" width="16" height="16" viewBox="0 0 24 24" style={{ color: 'var(--muted)' }}><path d="M9 18l6-6-6-6" /></svg>
              </div>
            </button>
          ))
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
