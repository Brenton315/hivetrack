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

export default function LogForm({ siteId, hiveId, hives, onClose, onSaved }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [logDate, setLogDate] = useState(today);
  const [selectedHiveId, setSelectedHiveId] = useState<string>(hiveId ?? '');
  const [framesOfBees, setFramesOfBees] = useState<number>(0);
  const [treatments, setTreatments] = useState('');
  const [feeding, setFeeding] = useState('');
  const [broodStoresRatio, setBroodStoresRatio] = useState('');
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
      log_date: logDate,
      frames_of_bees: framesOfBees || null,
      treatments: treatments || null,
      feeding: feeding || null,
      brood_stores_ratio: broodStoresRatio || null,
      notes: notes || null,
    };

    const { error: err } = await supabase.from('hive_logs').insert(row);
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
          <h2 className="text-xl font-bold text-gray-900">New Log Entry</h2>
          <button type="button" onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Date *</span>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>

          {hives && hives.length > 0 && !hiveId && (
            <label className="block mb-3">
              <span className="text-sm font-medium text-gray-700">Hive (leave blank for whole site)</span>
              <select
                value={selectedHiveId}
                onChange={(e) => setSelectedHiveId(e.target.value)}
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="">Whole site</option>
                {hives.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </label>
          )}

          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Frames of bees (strength)</span>
            <div className="flex items-center gap-3 mt-1">
              <button type="button" onClick={() => setFramesOfBees(Math.max(0, framesOfBees - 1))}
                className="w-11 h-11 flex items-center justify-center bg-gray-100 rounded-xl text-xl font-bold text-gray-600 active:bg-gray-200">
                -
              </button>
              <span className="text-2xl font-semibold text-gray-900 min-w-[3rem] text-center">{framesOfBees}</span>
              <button type="button" onClick={() => setFramesOfBees(framesOfBees + 1)}
                className="w-11 h-11 flex items-center justify-center bg-gray-100 rounded-xl text-xl font-bold text-gray-600 active:bg-gray-200">
                +
              </button>
            </div>
          </label>

          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Treatments</span>
            <input
              value={treatments}
              onChange={(e) => setTreatments(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. OA/GL strips in"
            />
          </label>

          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Feeding</span>
            <input
              value={feeding}
              onChange={(e) => setFeeding(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. 2L sugar syrup"
            />
          </label>

          <label className="block mb-3">
            <span className="text-sm font-medium text-gray-700">Brood:stores ratio</span>
            <input
              value={broodStoresRatio}
              onChange={(e) => setBroodStoresRatio(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. 60:40"
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              placeholder="Any observations..."
            />
          </label>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-base transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Log'}
          </button>
        </form>
      </div>
    </div>
  );
}
