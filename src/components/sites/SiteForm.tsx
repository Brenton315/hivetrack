import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Site } from '../../lib/database.types';

interface Props {
  site?: Site;
  onClose: () => void;
  onSaved: () => void;
}

const FLOWERING_OPTIONS = ['mānuka', 'kānuka', 'clover', 'other'];

export default function SiteForm({ site, onClose, onSaved }: Props) {
  const [name, setName] = useState(site?.name ?? '');
  const [hiveCount, setHiveCount] = useState(site?.hive_count ?? 0);
  const [lat, setLat] = useState(site?.lat?.toString() ?? '');
  const [lng, setLng] = useState(site?.lng?.toString() ?? '');
  const [locationText, setLocationText] = useState(site?.location_text ?? '');
  const [mainFlowering, setMainFlowering] = useState(site?.main_flowering ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not signed in'); setSaving(false); return; }

    const row = {
      user_id: user.id,
      name,
      hive_count: hiveCount,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      location_text: locationText || null,
      main_flowering: mainFlowering || null,
    };

    const result = site
      ? await supabase.from('sites').update(row).eq('id', site.id)
      : await supabase.from('sites').insert(row);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
    } else {
      onSaved();
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      () => setError('Could not get location')
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {site ? 'Edit Site' : 'New Site'}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
          </div>

          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Site name *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. Wairarapa Block"
            />
          </label>

          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Hive count</span>
            <div className="flex items-center gap-3 mt-1">
              <button type="button" onClick={() => setHiveCount(Math.max(0, hiveCount - 1))}
                className="w-11 h-11 flex items-center justify-center bg-gray-100 rounded-xl text-xl font-bold text-gray-600 active:bg-gray-200">
                -
              </button>
              <span className="text-2xl font-semibold text-gray-900 min-w-[3rem] text-center">{hiveCount}</span>
              <button type="button" onClick={() => setHiveCount(hiveCount + 1)}
                className="w-11 h-11 flex items-center justify-center bg-gray-100 rounded-xl text-xl font-bold text-gray-600 active:bg-gray-200">
                +
              </button>
            </div>
          </label>

          <div className="mb-3">
            <span className="text-sm font-medium text-gray-700">GPS pin</span>
            <div className="flex gap-2 mt-1">
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
                type="number"
                step="any"
                className="flex-1 px-3 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="Longitude"
                type="number"
                step="any"
                className="flex-1 px-3 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button type="button" onClick={handleGetLocation}
              className="mt-2 text-sm text-amber-600 font-medium">
              Use my location
            </button>
          </div>

          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Location description</span>
            <input
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. End of Mikimiki Rd"
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700">Main flowering</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {FLOWERING_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMainFlowering(mainFlowering === opt ? '' : opt)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    mainFlowering === opt
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </label>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-base transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : site ? 'Update Site' : 'Add Site'}
          </button>
        </form>
      </div>
    </div>
  );
}
