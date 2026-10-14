import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSites, useHives } from '../../lib/hooks';
import type { Harvest } from '../../lib/database.types';

const HONEY_TYPES = ['Manuka', 'Clover', 'Bush', 'Kamahi', 'Rata', 'Rewarewa', 'Pohutukawa', 'Wildflower', 'Mixed', 'Other'] as const;
const SEASONS = (() => {
  const y = new Date().getFullYear();
  return [`${y}/${y + 1}`, `${y - 1}/${y}`, `${y - 2}/${y - 1}`];
})();

interface Props {
  harvest?: Harvest | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function HarvestForm({ harvest, onClose, onSaved }: Props) {
  const { sites } = useSites();
  const { hives } = useHives();
  const [siteId, setSiteId] = useState(harvest?.site_id ?? '');
  const [hiveId, setHiveId] = useState(harvest?.hive_id ?? '');
  const [harvestDate, setHarvestDate] = useState(harvest?.harvest_date ?? new Date().toISOString().slice(0, 10));
  const [kg, setKg] = useState(String(harvest?.kg ?? ''));
  const [honeyType, setHoneyType] = useState(harvest?.honey_type ?? '');
  const [season, setSeason] = useState(harvest?.season ?? SEASONS[0]);
  const [notes, setNotes] = useState(harvest?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const siteHives = siteId ? hives.filter(h => h.site_id === siteId) : hives;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) { setError('Select a site'); return; }
    if (!kg || Number(kg) <= 0) { setError('Enter weight in kg'); return; }

    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not signed in'); setSaving(false); return; }

    const row = {
      user_id: user.id,
      site_id: siteId,
      hive_id: hiveId || null,
      harvest_date: harvestDate,
      kg: Number(kg),
      honey_type: honeyType || null,
      season,
      notes: notes || null,
    };

    const result = harvest
      ? await supabase.from('harvests').update(row).eq('id', harvest.id)
      : await supabase.from('harvests').insert(row);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
    } else {
      onSaved();
    }
  };

  return (
    <div className="hq-overlay">
      <div className="hq-modal">
        <div className="hq-modal-head">
          <h2>{harvest ? 'Edit Harvest' : 'Record Harvest'}</h2>
          <button type="button" onClick={onClose} className="hq-modal-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="hq-field">
              <label className="hq-label" htmlFor="h-site">Site *</label>
              <select id="h-site" value={siteId} onChange={e => { setSiteId(e.target.value); setHiveId(''); }} required className="hq-select">
                <option value="">Select site</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="hq-field">
              <label className="hq-label" htmlFor="h-hive">Hive</label>
              <select id="h-hive" value={hiveId} onChange={e => setHiveId(e.target.value)} className="hq-select">
                <option value="">Whole site</option>
                {siteHives.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="hq-field">
              <label className="hq-label" htmlFor="h-date">Date *</label>
              <input id="h-date" type="date" value={harvestDate} onChange={e => setHarvestDate(e.target.value)} required className="hq-input" />
            </div>
            <div className="hq-field">
              <label className="hq-label" htmlFor="h-kg">Weight (kg) *</label>
              <input id="h-kg" type="number" min="0.1" step="0.1" value={kg} onChange={e => setKg(e.target.value)} required className="hq-input" />
            </div>
            <div className="hq-field">
              <label className="hq-label" htmlFor="h-season">Season</label>
              <select id="h-season" value={season} onChange={e => setSeason(e.target.value)} className="hq-select">
                {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="h-type">Honey type</label>
            <select id="h-type" value={honeyType} onChange={e => setHoneyType(e.target.value)} className="hq-select">
              <option value="">Not specified</option>
              {HONEY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="h-notes">Notes</label>
            <input id="h-notes" value={notes} onChange={e => setNotes(e.target.value)} className="hq-input" placeholder="Optional" />
          </div>

          {error && <p className="hq-error" style={{ marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={saving} className="hq-btn-primary" style={{ width: '100%', minHeight: 44 }}>
            {saving ? 'Saving...' : harvest ? 'Update Harvest' : 'Record Harvest'}
          </button>
        </form>
      </div>
    </div>
  );
}
