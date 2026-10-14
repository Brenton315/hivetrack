import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Hive, DeletionReason, DeletionDisease } from '../../lib/database.types';

interface Props {
  hive: Hive;
  onClose: () => void;
  onDeleted: () => void;
}

const REASONS: { value: DeletionReason; label: string }[] = [
  { value: 'disease', label: 'Disease' },
  { value: 'died', label: 'Died / Dead out' },
  { value: 'merged', label: 'Merged with another hive' },
  { value: 'sold', label: 'Sold' },
  { value: 'other', label: 'Other' },
];

const DISEASES: { value: DeletionDisease; label: string }[] = [
  { value: 'AFB', label: 'American Foulbrood (AFB)' },
  { value: 'EFB', label: 'European Foulbrood (EFB)' },
  { value: 'nosema', label: 'Nosema' },
  { value: 'varroa', label: 'Varroa' },
  { value: 'chalkbrood', label: 'Chalkbrood' },
  { value: 'other', label: 'Other disease' },
];

export default function DeleteHiveDialog({ hive, onClose, onDeleted }: Props) {
  const [reason, setReason] = useState<DeletionReason | ''>('');
  const [disease, setDisease] = useState<DeletionDisease | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    if (!reason) { setError('Please select a reason'); return; }
    if (reason === 'disease' && !disease) { setError('Please select the disease'); return; }
    if (!confirmed) { setError('Please confirm the deletion'); return; }

    setSaving(true);
    setError('');

    const statusMap: Record<DeletionReason, string> = {
      disease: 'dead',
      died: 'dead',
      merged: 'merged',
      sold: 'sold',
      other: 'deleted',
    };

    const { error: err } = await supabase
      .from('hives')
      .update({
        status: statusMap[reason],
        deleted_at: new Date().toISOString(),
        deletion_reason: reason,
        deletion_disease: reason === 'disease' ? disease : null,
        notes: notes ? `${hive.notes ? hive.notes + '\n' : ''}Removed: ${notes}` : hive.notes,
      })
      .eq('id', hive.id);

    if (err) {
      setError(err.message);
      setSaving(false);
    } else {
      onDeleted();
    }
  };

  return (
    <div className="hq-overlay">
      <div className="hq-modal">
        <div className="hq-modal-head">
          <h2>Remove Hive</h2>
          <button type="button" onClick={onClose} className="hq-modal-close">&times;</button>
        </div>

        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
          Removing <strong>{hive.name}</strong> will mark it as inactive. The hive data and history will be preserved.
        </p>

        <div className="hq-field">
          <label className="hq-label">Reason for removal *</label>
          <select
            value={reason}
            onChange={(e) => { setReason(e.target.value as DeletionReason); setError(''); }}
            className="hq-select"
          >
            <option value="">Select a reason...</option>
            {REASONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {reason === 'disease' && (
          <div className="hq-field">
            <label className="hq-label">Disease type *</label>
            <select
              value={disease}
              onChange={(e) => { setDisease(e.target.value as DeletionDisease); setError(''); }}
              className="hq-select"
            >
              <option value="">Select disease...</option>
              {DISEASES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="hq-field">
          <label className="hq-label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="hq-input"
            rows={2}
            placeholder="Optional notes about this removal"
          />
        </div>

        <label className="hq-checkbox-row" style={{ margin: '16px 0' }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => { setConfirmed(e.target.checked); setError(''); }}
          />
          <span style={{ fontSize: 14 }}>I confirm I want to remove this hive</span>
        </label>

        {error && <p className="hq-error" style={{ marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onClose} className="hq-btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || !confirmed || !reason}
            className="hq-btn-danger"
            style={{ flex: 1, minHeight: 44 }}
          >
            {saving ? 'Removing...' : 'Remove Hive'}
          </button>
        </div>
      </div>
    </div>
  );
}
