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
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }
  if (!site) {
    return <div className="text-center py-12 text-gray-500">Site not found</div>;
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'hives', label: 'Hives', count: hives.length },
    { key: 'logs', label: 'Logs', count: logs.length },
    { key: 'harvests', label: 'Harvests', count: harvests.length },
  ];

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="px-4 pt-3 pb-4">
      <button onClick={() => navigate('/')} className="text-amber-600 font-medium text-sm mb-3 inline-flex items-center gap-1">
        ← Sites
      </button>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
          <p className="text-sm text-gray-500">
            {site.hive_count} hives
            {site.main_flowering && <> · {site.main_flowering}</>}
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg text-gray-600 active:bg-gray-200"
        >
          Edit
        </button>
      </div>

      {site.location_text && (
        <p className="text-sm text-gray-500 mb-3">{site.location_text}</p>
      )}

      <div className="flex gap-4 text-sm mb-3">
        <div>
          <span className="text-gray-400">Last inspected</span>
          <p className="font-medium text-gray-700">{formatDate(site.last_inspected)}</p>
        </div>
        <div>
          <span className="text-gray-400">Last harvested</span>
          <p className="font-medium text-gray-700">{formatDate(site.last_harvested)}</p>
        </div>
      </div>

      {site.lat != null && site.lng != null && (
        <div className="mb-4">
          <SiteMap lat={site.lat} lng={site.lng} />
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
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
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowLogForm(true)}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium active:bg-amber-600"
            >
              + Log Entry
            </button>
          </div>
          <LogList logs={logs} hives={hives} />
        </div>
      )}

      {tab === 'harvests' && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowHarvestForm(true)}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium active:bg-amber-600"
            >
              + Harvest
            </button>
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
    </div>
  );
}
