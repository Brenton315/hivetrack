import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ParsedEvent } from '../../lib/ai';
import { eventTypeLabel, confidenceLabel, confidenceColor } from '../../lib/ai';

interface Props {
  events: ParsedEvent[];
  siteId: string;
  hiveMap: Map<string, string>; // hive name -> hive id
  onClose: () => void;
  onSaved: () => void;
}

export default function AIConfirmDialog({ events, siteId, hiveMap, onClose, onSaved }: Props) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(events.map((_, i) => i))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleIndex = (i: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleConfirm = async () => {
    const selected = events.filter((_, i) => selectedIndices.has(i));
    if (selected.length === 0) { setError('Select at least one event to save'); return; }

    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not signed in'); setSaving(false); return; }

    const rows = selected.map(ev => {
      const hiveId = ev.hive_name ? hiveMap.get(ev.hive_name.toLowerCase()) ?? null : null;
      return {
        user_id: user.id,
        hive_id: hiveId,
        site_id: siteId,
        event_type: ev.event_type,
        event_date: ev.event_date ?? new Date().toISOString().slice(0, 10),
        data: ev.data,
        notes: ev.notes,
      };
    });

    const { error: err } = await supabase.from('hive_events').insert(rows);

    if (err) {
      setError(err.message);
      setSaving(false);
    } else {
      onSaved();
    }
  };

  const formatData = (data: Record<string, unknown>): string => {
    return Object.entries(data)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
      .join(', ');
  };

  return (
    <div className="hq-overlay">
      <div className="hq-modal" style={{ maxWidth: 540 }}>
        <div className="hq-modal-head">
          <h2>Confirm AI-Parsed Events</h2>
          <button type="button" onClick={onClose} className="hq-modal-close">&times;</button>
        </div>

        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
          Review the parsed events below. Uncheck any you don't want to save.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
          {events.map((ev, i) => {
            const matchedHive = ev.hive_name ? hiveMap.has(ev.hive_name.toLowerCase()) : false;
            return (
              <label
                key={i}
                className="hq-card"
                style={{
                  padding: 12,
                  cursor: 'pointer',
                  opacity: selectedIndices.has(i) ? 1 : 0.5,
                  border: selectedIndices.has(i) ? '1px solid var(--primary)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectedIndices.has(i)}
                    onChange={() => toggleIndex(i)}
                    style={{ marginTop: 3 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{eventTypeLabel(ev.event_type)}</span>
                      {ev.hive_name && (
                        <span style={{
                          fontSize: 12,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: matchedHive ? 'var(--strong)' : 'var(--weak-text)',
                          color: '#fff',
                        }}>
                          {ev.hive_name}{!matchedHive && ' (not found)'}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: confidenceColor(ev.confidence), marginLeft: 'auto' }}>
                        {confidenceLabel(ev.confidence)}
                      </span>
                    </div>
                    {ev.event_date && (
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{ev.event_date}</div>
                    )}
                    <div style={{ fontSize: 13, marginTop: 2 }}>{formatData(ev.data)}</div>
                    {ev.notes && (
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2, fontStyle: 'italic' }}>{ev.notes}</div>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {error && <p className="hq-error" style={{ margin: '12px 0' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onClose} className="hq-btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || selectedIndices.size === 0}
            className="hq-btn-primary"
            style={{ flex: 1, minHeight: 44 }}
          >
            {saving ? 'Saving...' : `Save ${selectedIndices.size} event${selectedIndices.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
