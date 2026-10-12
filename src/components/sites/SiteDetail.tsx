import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSite, useHives, useLogs, useHarvests } from '../../lib/hooks';
import SiteMap from './SiteMap';
import SiteForm from './SiteForm';
import HiveList from '../hives/HiveList';
import LogList from '../logs/LogList';
import LogForm from '../logs/LogForm';
import HarvestList from '../harvests/HarvestList';
import HarvestForm from '../harvests/HarvestForm';

type Tab = 'hives' | 'logs' | 'harvests';

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { site, loading, refetch } = useSite(id);
  const { hives, refetch: refetchHives } = useHives(id);
  const { logs, refetch: refetchLogs } = useLogs(id);
  const { harvests, refetch: refetchHarvests } = useHarvests(id);
  const [tab, setTab] = useState<Tab>('hives');
  const [editing, setEditing] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showHarvestForm, setShowHarvestForm] = useState(false);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>;
  }
  if (!site) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Site not found</div>;
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'hives', label: 'Hives', count: hives.length },
    { key: 'logs', label: 'Logs', count: logs.length },
    { key: 'harvests', label: 'Harvests', count: harvests.length },
  ];

  return (
    <>
      <button className="hq-back" onClick={() => navigate('/sites')}>
        <svg className="icon" width="14" height="14" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
        Sites
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1>{site.name}</h1>
          <span className="hq-subtitle">
            {site.hive_count} hives{site.main_flowering ? ` · ${site.main_flowering}` : ''}
          </span>
        </div>
        <button className="hq-btn-secondary" onClick={() => setEditing(true)}>Edit</button>
      </div>

      {site.location_text && (
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>{site.location_text}</p>
      )}

      {site.lat != null && site.lng != null && (
        <SiteMap lat={site.lat} lng={site.lng} />
      )}

      <div className="hq-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`hq-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === 'hives' && (
        <HiveList siteId={id!} hives={hives} onChanged={refetchHives} />
      )}

      {tab === 'logs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="hq-btn-primary" onClick={() => setShowLogForm(true)}>+ Log Entry</button>
          </div>
          <LogList logs={logs} hives={hives} />
        </div>
      )}

      {tab === 'harvests' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="hq-btn-primary" onClick={() => setShowHarvestForm(true)}>+ Harvest</button>
          </div>
          <HarvestList harvests={harvests} hives={hives} />
        </div>
      )}

      {editing && (
        <SiteForm
          site={site}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); refetch(); }}
        />
      )}

      {showLogForm && (
        <LogForm
          siteId={id!}
          hives={hives}
          onClose={() => setShowLogForm(false)}
          onSaved={() => { setShowLogForm(false); refetchLogs(); refetch(); }}
        />
      )}

      {showHarvestForm && (
        <HarvestForm
          siteId={id!}
          hives={hives}
          onClose={() => setShowHarvestForm(false)}
          onSaved={() => { setShowHarvestForm(false); refetchHarvests(); refetch(); }}
        />
      )}
    </>
  );
}
