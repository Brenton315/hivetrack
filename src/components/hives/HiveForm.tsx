import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { SETTINGS } from '../../lib/settings';
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
  const [queenBreed, setQueenBreed] = useState(hive?.queen_breed ?? '');
  const [queenYear, setQueenYear] = useState<number | ''>(hive?.queen_year ?? '');
  const [notes, setNotes] = useState(hive?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: SETTINGS.queen.yearRange }, (_, i) => currentYear - i);

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
      queen_breed: queenBreed || null,
      queen_year: queenYear || null,
      notes: notes || null,
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
    <div className="hq-overlay">
      <div className="hq-modal">
        <div className="hq-modal-head">
          <h2>{hive ? 'Edit Hive' : 'New Hive'}</h2>
          <button type="button" onClick={onClose} className="hq-modal-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="hq-field">
            <label className="hq-label" htmlFor="hive-name">Hive name / number *</label>
            <input
              id="hive-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="hq-input"
              placeholder="e.g. H12 or Queen Bee"
            />
          </div>

          {sites && sites.length > 0 && (
            <div className="hq-field">
              <label className="hq-label" htmlFor="hive-site">Current site</label>
              <select
                id="hive-site"
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="hq-select"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="hq-field">
            <label className="hq-label" htmlFor="hive-breed">Queen breed</label>
            <select
              id="hive-breed"
              value={queenBreed}
              onChange={(e) => setQueenBreed(e.target.value)}
              className="hq-select"
            >
              <option value="">Not set</option>
              {SETTINGS.queen.breeds.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="hive-year">Queen year</label>
            <select
              id="hive-year"
              value={queenYear}
              onChange={(e) => setQueenYear(e.target.value ? Number(e.target.value) : '')}
              className="hq-select"
            >
              <option value="">Not set</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="hive-notes">Notes</label>
            <textarea
              id="hive-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="hq-input"
              rows={3}
              placeholder="Optional notes"
            />
          </div>

          {error && <p className="hq-error" style={{ marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={saving} className="hq-btn-primary" style={{ width: '100%', minHeight: 44 }}>
            {saving ? 'Saving...' : hive ? 'Update Hive' : 'Add Hive'}
          </button>
        </form>
      </div>
    </div>
  );
}
