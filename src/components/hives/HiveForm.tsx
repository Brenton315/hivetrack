import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Hive, Site } from '../../lib/database.types';

interface Props {
  siteId: string;
  hive?: Hive;
  sites?: Site[];
  onClose: () => void;
  onSaved: () => void;
}

export default function HiveForm({ siteId, hive, sites, onClose, onSaved }: Props) {
  const [name, setName] = useState(hive?.name ?? '');
  const [selectedSiteId, setSelectedSiteId] = useState(hive?.site_id ?? siteId);
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
      site_id: selectedSiteId,
    };

    const result = hive
      ? await supabase.from('hives').update(row).eq('id', hive.id)
      : await supabase.from('hives').insert(row);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
    } else {
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {hive ? 'Edit Hive' : 'New Hive'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Hive name / number *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. H12 or Queen Bee"
            />
          </label>

          {sites && sites.length > 0 && (
            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700">Current site</span>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          )}

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-base transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : hive ? 'Update Hive' : 'Add Hive'}
          </button>
        </form>
      </div>
    </div>
  );
}
