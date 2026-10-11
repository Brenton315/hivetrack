import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSites } from '../../lib/hooks';
import SiteCard from './SiteCard';
import SiteForm from './SiteForm';

export default function SiteList() {
  const { sites, loading, refetch } = useSites();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">My Sites</h1>
        <button
          onClick={() => setShowForm(true)}
          className="w-11 h-11 flex items-center justify-center bg-amber-500 text-white rounded-full text-2xl shadow-md active:scale-95 transition-transform"
        >
          +
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : sites.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏡</div>
          <p className="text-gray-500">No sites yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-amber-600 font-medium"
          >
            Add your first site
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onClick={() => navigate(`/sites/${site.id}`)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <SiteForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refetch(); }}
        />
      )}
    </div>
  );
}
