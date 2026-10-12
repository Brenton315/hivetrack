import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHive, useLogs, useHarvests, useHiveSiteHistory, useSites } from '../../lib/hooks';
import HiveForm from './HiveForm';
import LogList from '../logs/LogList';
import LogForm from '../logs/LogForm';
import HarvestList from '../harvests/HarvestList';
import HarvestForm from '../harvests/HarvestForm';

type Tab = 'logs' | 'harvests' | 'history';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function formatDate(d: string): string {
  const p = d.split('-');
  return `${Number(p[2])} ${MONTHS[Number(p[1]) - 1]} ${p[0]}`;
}

export default function HiveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hive, loading, refetch } = useHive(id);
  const { logs, refetch: refetchLogs } = useLogs(undefined, id);
  const { harvests, refetch: refetchHarvests } = useHarvests(undefined, id);
  const { sites } = useSites();
  const history = useHiveSiteHistory(id);
  const [tab, setTab] = useState<Tab>('logs');
  const [editing, setEditing] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showHarvestForm, setShowHarvestForm] = useState(false);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>;
  if (!hive) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Hive not found</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'logs', label: `Logs (${logs.length})` },
    { key: 'harvests', label: `Harvests (${harvests.length})` },
    { key: 'history', label: 'Site History' },
  ];

  return (
    <>
      <button className="hq-back" onClick={() => navigate(-1)}>
        <svg className="icon" width="14" height="14" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
        Back
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1>{hive.name}</h1>
          {hive.site_name && <span className="hq-subtitle">at {hive.site_name}</span>}
        </div>
        <button className="hq-btn-secondary" onClick={() => setEditing(true)}>Edit</button>
      </div>

      <div className="hq-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`hq-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'logs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="hq-btn-primary" onClick={() => setShowLogForm(true)}>+ Log Entry</button>
          </div>
          <LogList logs={logs} />
        </div>
      )}

      {tab === 'harvests' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="hq-btn-primary" onClick={() => setShowHarvestForm(true)}>+ Harvest</button>
          </div>
          <HarvestList harvests={harvests} />
        </div>
      )}

      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No site history recorded</p>
          ) : (
            history.map((h) => (
              <div key={h.site_id} className="hq-card" style={{ padding: 16 }}>
                <p style={{ fontWeight: 500, margin: 0 }}>{h.site_name}</p>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
                  {formatDate(h.first_date)}
                  {h.first_date !== h.last_date && ` -- ${formatDate(h.last_date)}`}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {editing && hive.site_id && (
        <HiveForm
          siteId={hive.site_id}
          hive={hive}
          sites={sites}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); refetch(); }}
        />
      )}

      {showLogForm && hive.site_id && (
        <LogForm
          siteId={hive.site_id}
          hiveId={id}
          onClose={() => setShowLogForm(false)}
          onSaved={() => { setShowLogForm(false); refetchLogs(); }}
        />
      )}

      {showHarvestForm && hive.site_id && (
        <HarvestForm
          siteId={hive.site_id}
          hiveId={id}
          onClose={() => setShowHarvestForm(false)}
          onSaved={() => { setShowHarvestForm(false); refetchHarvests(); }}
        />
      )}
    </>
  );
}
