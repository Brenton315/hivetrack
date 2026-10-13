import { useState } from 'react';
import { useAuth } from '../../lib/hooks';
import { createQueen } from '../../lib/queens';
import type { Queen } from '../../lib/database.types';

interface Props {
  queens: Queen[];
  onDone: () => void;
}

export default function QueenForm({ queens, onDone }: Props) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [line, setLine] = useState('');
  const [motherId, setMotherId] = useState('');
  const [graftDate, setGraftDate] = useState(new Date().toISOString().slice(0, 10));
  const [cost, setCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const motherOptions = queens.filter(q => q.stage === 'laying' || q.stage === 'introduced');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !code.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createQueen(user.id, {
        code: code.trim(),
        line: line.trim() || 'Unknown',
        mother_id: motherId || null,
        graft_date: graftDate,
        stage: 'graft',
        stage_date: graftDate,
        hive_id: null,
        site_id: null,
        notes: notes.trim() || null,
        cost: parseFloat(cost) || 0,
        sold_price: null,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="hq-card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>New graft</h2>

      {error && (
        <div style={{ padding: '8px 12px', background: 'var(--weak-text)', color: '#fff', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="hq-field">
        <label className="hq-label">Queen code *</label>
        <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. Q-2024-001" required
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
      </div>

      <div className="hq-field">
        <label className="hq-label">Line / breed</label>
        <input type="text" value={line} onChange={e => setLine(e.target.value)} placeholder="e.g. Italian, Carniolan"
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
      </div>

      <div className="hq-field">
        <label className="hq-label">Mother queen</label>
        <select value={motherId} onChange={e => setMotherId(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }}>
          <option value="">None / unknown</option>
          {motherOptions.map(q => (
            <option key={q.id} value={q.id}>{q.code} ({q.line})</option>
          ))}
        </select>
      </div>

      <div className="hq-field">
        <label className="hq-label">Graft date</label>
        <input type="date" value={graftDate} onChange={e => setGraftDate(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
      </div>

      <div className="hq-field">
        <label className="hq-label">Cost (NZD)</label>
        <input type="number" value={cost} onChange={e => setCost(e.target.value)} min="0" step="0.01"
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
      </div>

      <div className="hq-field">
        <label className="hq-label">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="submit" className="hq-btn-primary" disabled={saving || !code.trim()} style={{ flex: 1 }}>
          {saving ? 'Saving...' : 'Create graft'}
        </button>
        <button type="button" className="hq-btn-secondary" onClick={onDone} style={{ flex: 1 }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
