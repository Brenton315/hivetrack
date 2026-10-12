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

          {error && <p className="hq-error" style={{ marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={saving} className="hq-btn-primary" style={{ width: '100%', minHeight: 44 }}>
            {saving ? 'Saving...' : hive ? 'Update Hive' : 'Add Hive'}
          </button>
        </form>
      </div>
    </div>
  );
}
