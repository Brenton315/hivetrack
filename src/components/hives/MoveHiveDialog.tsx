import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSites } from '../../lib/hooks';
import type { Hive } from '../../lib/database.types';

interface Props {
  hive: Hive;
  currentSiteName: string;
  onClose: () => void;
  onMoved: () => void;
}

export default function MoveHiveDialog({ hive, currentSiteName, onClose, onMoved }: Props) {
  const { sites } = useSites();
  const [targetSiteId, setTargetSiteId] = useState('');
  const [moveDate, setMoveDate] = useState(new Date().toISOString().slice(0, 10));
  const [flowType, setFlowType] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const otherSites = sites.filter(s => s.id !== hive.site_id);
  const targetSite = sites.find(s => s.id === targetSiteId);

  const handleMove = async () => {
    if (!targetSiteId) { setError('Please select a destination site'); return; }
    if (!confirmed) { setError('Please confirm the move'); return; }

    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not signed in'); setSaving(false); return; }

    // Update hive's site_id
    const { error: updateErr } = await supabase
      .from('hives')
      .update({ site_id: targetSiteId })
      .eq('id', hive.id);

    if (updateErr) {
      setError(updateErr.message);
      setSaving(false);
      return;
    }

    // Record move event
    await supabase.from('hive_events').insert({
      user_id: user.id,
      hive_id: hive.id,
      site_id: hive.site_id,
      event_type: 'move',
      event_date: moveDate,
      data: {
        from_site_id: hive.site_id,
        to_site_id: targetSiteId,
        from_site_name: currentSiteName,
        to_site_name: targetSite?.name ?? '',
        flow_type: flowType || undefined,
      },
      notes: notes || null,
    });

    // Record in hive_movements table
    await supabase.from('hive_movements').insert({
      company_id: null,
      hive_id: hive.id,
      from_site_id: hive.site_id,
      to_site_id: targetSiteId,
      moved_date: moveDate,
      flow_type: flowType || null,
      moved_by: user.id,
      notes: notes || null,
    });

    onMoved();
  };

  return (
    <div className="hq-overlay">
      <div className="hq-modal">
        <div className="hq-modal-head">
          <h2>Move Hive</h2>
          <button type="button" onClick={onClose} className="hq-modal-close">&times;</button>
        </div>

        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
          Move <strong>{hive.name}</strong> from <strong>{currentSiteName}</strong> to another site.
        </p>

        <div className="hq-field">
          <label className="hq-label">Destination site *</label>
          {otherSites.length === 0 ? (
            <p className="hq-muted" style={{ fontSize: 14 }}>No other sites available. Create another site first.</p>
          ) : (
            <select
              value={targetSiteId}
              onChange={(e) => { setTargetSiteId(e.target.value); setError(''); }}
              className="hq-select"
            >
              <option value="">Select site...</option>
              {otherSites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="hq-field">
          <label className="hq-label" htmlFor="move-date">Move date</label>
          <input
            id="move-date"
            type="date"
            value={moveDate}
            onChange={(e) => setMoveDate(e.target.value)}
            className="hq-input"
          />
        </div>

        <div className="hq-field">
          <label className="hq-label" htmlFor="move-flow">Honey flow / reason</label>
          <input
            id="move-flow"
            value={flowType}
            onChange={(e) => setFlowType(e.target.value)}
            className="hq-input"
            placeholder="e.g. Manuka flow, winter placement"
          />
        </div>

        <div className="hq-field">
          <label className="hq-label" htmlFor="move-notes">Notes</label>
          <textarea
            id="move-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="hq-input"
            rows={2}
            placeholder="Optional notes"
          />
        </div>

        <label className="hq-checkbox-row" style={{ margin: '16px 0' }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => { setConfirmed(e.target.checked); setError(''); }}
          />
          <span style={{ fontSize: 14 }}>
            Confirm move to {targetSite?.name ?? 'selected site'}
          </span>
        </label>

        {error && <p className="hq-error" style={{ marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onClose} className="hq-btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={saving || !confirmed || !targetSiteId}
            className="hq-btn-primary"
            style={{ flex: 1, minHeight: 44 }}
          >
            {saving ? 'Moving...' : 'Move Hive'}
          </button>
        </div>
      </div>
    </div>
  );
}
