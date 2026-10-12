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
    <div className="hq-overlay">
      <div className="hq-modal">
        <div className="hq-modal-head">
          <h2>New Log Entry</h2>
          <button type="button" onClick={onClose} className="hq-modal-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="hq-field">
            <label className="hq-label" htmlFor="log-date">Date *</label>
            <input id="log-date" type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required className="hq-input" />
          </div>

          {hives && hives.length > 0 && !hiveId && (
            <div className="hq-field">
              <label className="hq-label" htmlFor="log-hive">Hive (leave blank for whole site)</label>
              <select id="log-hive" value={selectedHiveId} onChange={(e) => setSelectedHiveId(e.target.value)} className="hq-select">
                <option value="">Whole site</option>
                {hives.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="hq-field">
            <span className="hq-label">Frames of bees (strength)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="button" onClick={() => setFramesOfBees(Math.max(0, framesOfBees - 1))} className="hq-btn-secondary" style={{ width: 40, minHeight: 40, padding: 0, justifyContent: 'center' }}>-</button>
              <span style={{ fontSize: 22, fontWeight: 600, minWidth: 40, textAlign: 'center' }}>{framesOfBees}</span>
              <button type="button" onClick={() => setFramesOfBees(framesOfBees + 1)} className="hq-btn-secondary" style={{ width: 40, minHeight: 40, padding: 0, justifyContent: 'center' }}>+</button>
            </div>
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="log-treatments">Treatments</label>
            <input id="log-treatments" value={treatments} onChange={(e) => setTreatments(e.target.value)} className="hq-input" placeholder="e.g. OA/GL strips in" />
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="log-feeding">Feeding</label>
            <input id="log-feeding" value={feeding} onChange={(e) => setFeeding(e.target.value)} className="hq-input" placeholder="e.g. 2L sugar syrup" />
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="log-ratio">Brood:stores ratio</label>
            <input id="log-ratio" value={broodStoresRatio} onChange={(e) => setBroodStoresRatio(e.target.value)} className="hq-input" placeholder="e.g. 60:40" />
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="log-notes">Notes</label>
            <textarea id="log-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="hq-input" style={{ resize: 'none' }} placeholder="Any observations..." />
          </div>

          {error && <p className="hq-error" style={{ marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={saving} className="hq-btn-primary" style={{ width: '100%', minHeight: 44 }}>
            {saving ? 'Saving...' : 'Save Log'}
          </button>
        </form>
      </div>
    </div>
  );
}
