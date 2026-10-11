import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHive, useLogs, useHarvests, useHiveSiteHistory, useSites } from '../../lib/hooks';
import HiveForm from './HiveForm';
import LogList from '../logs/LogList';
import LogForm from '../logs/LogForm';
import HarvestList from '../harvests/HarvestList';
import HarvestForm from '../harvests/HarvestForm';

type Tab = 'logs' | 'harvests' | 'history';

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

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!hive) return <div className="text-center py-12 text-gray-500">Hive not found</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'logs', label: `Logs (${logs.length})` },
    { key: 'harvests', label: `Harvests (${harvests.length})` },
    { key: 'history', label: 'Site History' },
  ];

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="px-4 pt-3 pb-4">
      <button onClick={() => navigate(-1)} className="text-amber-600 font-medium text-sm mb-3 inline-flex items-center gap-1">
        ← Back
      </button>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🐝 {hive.name}</h1>
          {hive.site_name && (
            <p className="text-sm text-gray-500">at {hive.site_name}</p>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg text-gray-600 active:bg-gray-200"
        >
          Edit
        </button>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'logs' && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowLogForm(true)}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium"
            >
              + Log Entry
            </button>
          </div>
          <LogList logs={logs} />
        </div>
      )}

      {tab === 'harvests' && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowHarvestForm(true)}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium"
            >
              + Harvest
            </button>
          </div>
          <HarvestList harvests={harvests} />
        </div>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <p className="text-center text-gray-400 py-6">No site history recorded</p>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((h) => (
                <div key={h.site_id} className="bg-white rounded-xl p-3 border border-gray-100">
                  <p className="font-medium text-gray-900">{h.site_name}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(h.first_date)}
                    {h.first_date !== h.last_date && ` — ${formatDate(h.last_date)}`}
                  </p>
                </div>
              ))}
            </div>
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
    </div>
  );
}
