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
    <div className="hq-overlay">
      <div className="hq-modal">
        <div className="hq-modal-head">
          <h2>New Harvest</h2>
          <button type="button" onClick={onClose} className="hq-modal-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="hq-field">
            <label className="hq-label" htmlFor="harvest-date">Date *</label>
            <input id="harvest-date" type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} required className="hq-input" />
          </div>

          {hives && hives.length > 0 && !hiveId && (
            <div className="hq-field">
              <label className="hq-label" htmlFor="harvest-hive">Hive (leave blank for site total)</label>
              <select id="harvest-hive" value={selectedHiveId} onChange={(e) => setSelectedHiveId(e.target.value)} className="hq-select">
                <option value="">Site total</option>
                {hives.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="hq-field">
            <label className="hq-label" htmlFor="harvest-kg">Kilograms *</label>
            <input id="harvest-kg" type="number" step="0.1" min="0" value={kg} onChange={(e) => setKg(e.target.value)} required className="hq-input" placeholder="e.g. 45.5" />
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="harvest-season">Season *</label>
            <input id="harvest-season" value={season} onChange={(e) => setSeason(e.target.value)} required className="hq-input" placeholder="e.g. 2025/26" />
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="harvest-type">Honey type</label>
            <input id="harvest-type" value={honeyType} onChange={(e) => setHoneyType(e.target.value)} className="hq-input" placeholder="e.g. Manuka, Clover, Bush blend" />
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="harvest-notes">Notes</label>
            <textarea id="harvest-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="hq-input" style={{ resize: 'none' }} />
          </div>

          {error && <p className="hq-error" style={{ marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={saving} className="hq-btn-primary" style={{ width: '100%', minHeight: 44 }}>
            {saving ? 'Saving...' : 'Save Harvest'}
          </button>
        </form>
      </div>
    </div>
  );
}
