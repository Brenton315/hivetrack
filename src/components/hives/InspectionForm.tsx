import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Hive } from '../../lib/database.types';
import { SETTINGS } from '../../lib/settings';

interface Props {
  hive: Hive;
  onClose: () => void;
  onSaved: () => void;
}

export default function InspectionForm({ hive, onClose, onSaved }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [framesOfBees, setFramesOfBees] = useState('');
  const [framesOfStores, setFramesOfStores] = useState('');
  const [framesOfBrood, setFramesOfBrood] = useState('');
  const [queenSeen, setQueenSeen] = useState(false);
  const [temper, setTemper] = useState('calm');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not signed in'); setSaving(false); return; }

    const inspData = {
      frames_of_bees: Number(framesOfBees),
      frames_of_stores: Number(framesOfStores),
      frames_of_brood: Number(framesOfBrood),
      queen_seen: queenSeen,
      temper,
    };

    const { error: err } = await supabase.from('hive_events').insert({
      user_id: user.id,
      hive_id: hive.id,
      site_id: hive.site_id,
      event_type: 'inspection',
      event_date: date,
      data: inspData,
      notes: notes || null,
    });

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
          <h2>Inspect {hive.name}</h2>
          <button type="button" onClick={onClose} className="hq-modal-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="hq-field">
            <label className="hq-label" htmlFor="insp-date">Date</label>
            <input id="insp-date" type="date" value={date} onChange={e => setDate(e.target.value)} required className="hq-input" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="hq-field">
              <label className="hq-label" htmlFor="insp-bees">Frames bees *</label>
              <input id="insp-bees" type="number" min="0" max="30" value={framesOfBees} onChange={e => setFramesOfBees(e.target.value)} required className="hq-input" />
            </div>
            <div className="hq-field">
              <label className="hq-label" htmlFor="insp-stores">Frames stores *</label>
              <input id="insp-stores" type="number" min="0" max="30" value={framesOfStores} onChange={e => setFramesOfStores(e.target.value)} required className="hq-input" />
            </div>
            <div className="hq-field">
              <label className="hq-label" htmlFor="insp-brood">Frames brood *</label>
              <input id="insp-brood" type="number" min="0" max="30" value={framesOfBrood} onChange={e => setFramesOfBrood(e.target.value)} required className="hq-input" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="hq-field">
              <label className="hq-label" htmlFor="insp-temper">Temper</label>
              <select id="insp-temper" value={temper} onChange={e => setTemper(e.target.value)} className="hq-select">
                <option value="calm">Calm</option>
                <option value="nervous">Nervous</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
            <label className="hq-checkbox-row" style={{ alignSelf: 'end', paddingBottom: 10 }}>
              <input type="checkbox" checked={queenSeen} onChange={e => setQueenSeen(e.target.checked)} />
              <span style={{ fontSize: 14 }}>Queen seen</span>
            </label>
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="insp-notes">Notes</label>
            <textarea id="insp-notes" value={notes} onChange={e => setNotes(e.target.value)} className="hq-input" rows={2} placeholder="Any observations..." />
          </div>

          {error && <p className="hq-error" style={{ marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={saving} className="hq-btn-primary" style={{ width: '100%', minHeight: 44 }}>
            {saving ? 'Saving...' : 'Log Inspection'}
          </button>
        </form>
      </div>
    </div>
  );
}
