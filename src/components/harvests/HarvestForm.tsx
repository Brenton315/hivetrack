import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Hive } from '../../lib/database.types';

interface Props {
  siteId: string;
  hiveId?: string;
  hives?: Hive[];
  onClose: () => void;
  onSaved: () => void;
}

function currentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 6) return `${year}/${(year + 1).toString().slice(2)}`;
  return `${year - 1}/${year.toString().slice(2)}`;
}

export default function HarvestForm({ siteId, hiveId, hives, onClose, onSaved }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [harvestDate, setHarvestDate] = useState(today);
  const [selectedHiveId, setSelectedHiveId] = useState<string>(hiveId ?? '');
  const [kg, setKg] = useState('');
  const [season, setSeason] = useState(currentSeason());
  const [honeyType, setHoneyType] = useState('');
  const [notes, setNotes] = useState('');
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
      site_id: siteId,
      hive_id: selectedHiveId || null,
      harvest_date: harvestDate,
      kg: parseFloat(kg),
      season,
      honey_type: honeyType || null,
      notes: notes || null,
    };

    const { error: err } = await supabase.from('harvests').insert(row);
    if (err) {
      setError(err.message);
      setSaving(false);
    } else {
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">New Harvest</h2>
          <button type="button" onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Date *</span>
            <input
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>

          {hives && hives.length > 0 && !hiveId && (
            <label className="block mb-3">
              <span className="text-sm font-medium text-gray-700">Hive (leave blank for site total)</span>
              <select
                value={selectedHiveId}
                onChange={(e) => setSelectedHiveId(e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="">Site total</option>
                {hives.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </label>
          )}

          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Kilograms *</span>
            <input
              type="number"
              step="0.1"
              min="0"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. 45.5"
            />
          </label>

          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Season *</span>
            <input
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. 2025/26"
            />
          </label>

          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Honey type</span>
            <input
              value={honeyType}
              onChange={(e) => setHoneyType(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. Mānuka, Clover, Bush blend"
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </label>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-base transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Harvest'}
          </button>
        </form>
      </div>
    </div>
  );
}
