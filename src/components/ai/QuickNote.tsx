import { useState } from 'react';
import { parseNotes, eventTypeLabel, confidenceLabel, confidenceColor } from '../../lib/ai';
import type { ParsedEvent } from '../../lib/ai';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/hooks';

export default function QuickNote() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedEvent[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    if (!text.trim()) return;
    setError(null);
    setParsed(null);
    setSaved(false);
    setParsing(true);
    try {
      const result = await parseNotes([text.trim()]);
      setParsed(result.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirm() {
    if (!parsed || !user) return;
    setSaving(true);
    setError(null);
    try {
      const { data: sites } = await supabase
        .from('sites')
        .select('id, name')
        .eq('user_id', user.id);
      const { data: hives } = await supabase
        .from('hives')
        .select('id, name, site_id')
        .eq('user_id', user.id);

      const siteMap = new Map((sites ?? []).map(s => [s.name.toLowerCase(), s.id]));
      const hiveMap = new Map((hives ?? []).map(h => [h.name.toLowerCase(), { id: h.id, site_id: h.site_id }]));

      const rows = parsed.map(evt => {
        let siteId: string | null = null;
        let hiveId: string | null = null;

        if (evt.hive_name) {
          const hive = hiveMap.get(evt.hive_name.toLowerCase());
          if (hive) { hiveId = hive.id; siteId = hive.site_id; }
        }
        if (!siteId && evt.site_name) {
          siteId = siteMap.get(evt.site_name.toLowerCase()) ?? null;
        }
        if (!siteId && sites && sites.length === 1) {
          siteId = sites[0].id;
        }

        return {
          user_id: user.id,
          hive_id: hiveId,
          site_id: siteId ?? '',
          event_type: evt.event_type,
          event_date: evt.event_date ?? new Date().toISOString().slice(0, 10),
          data: { ...evt.data, source: 'ai' },
          notes: evt.notes,
        };
      }).filter(r => r.site_id);

      if (rows.length === 0) {
        setError('Could not match any events to your sites. Check site/hive names in your note.');
        setSaving(false);
        return;
      }

      const { error: insertErr } = await supabase.from('hive_events').insert(rows);
      if (insertErr) throw insertErr;

      setSaved(true);
      setText('');
      setParsed(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setParsed(null);
    setError(null);
    setSaved(false);
  }

  return (
    <div className="hq-card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Quick note</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
        Type your field notes in plain language. AI will extract structured events for review.
      </p>

      {saved && (
        <div style={{ padding: '10px 14px', background: 'var(--strong)', color: '#fff', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
          Events saved successfully.
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', background: 'var(--weak-text)', color: '#fff', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

      {!parsed && (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="e.g. Checked Riverside today. Hive 3 looking strong, 8 frames of bees. Fed all hives 2L sugar syrup. Applied Apivar strips to hive 5."
            rows={4}
            style={{
              width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--line)',
              background: 'var(--surface)', color: 'var(--ink)', fontSize: 14,
              fontFamily: 'inherit', resize: 'vertical',
            }}
          />
          <button
            className="hq-btn-primary"
            onClick={handleParse}
            disabled={parsing || !text.trim()}
            style={{ marginTop: 10, width: '100%' }}
          >
            {parsing ? 'Parsing...' : 'Parse note'}
          </button>
        </>
      )}

      {parsed && parsed.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
            {parsed.length} event{parsed.length !== 1 ? 's' : ''} extracted — review before saving:
          </p>
          {parsed.map((evt, i) => (
            <div key={i} style={{
              padding: '10px 14px', borderRadius: 8, border: '1px solid var(--line)',
              marginBottom: 8, background: 'var(--surface)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{eventTypeLabel(evt.event_type)}</span>
                <span style={{ fontSize: 12, color: confidenceColor(evt.confidence) }}>
                  {confidenceLabel(evt.confidence)} confidence
                </span>
              </div>
              {evt.site_name && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Site: {evt.site_name}</div>}
              {evt.hive_name && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Hive: {evt.hive_name}</div>}
              {evt.event_date && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Date: {evt.event_date}</div>}
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                {Object.entries(evt.data).map(([k, v]) => (
                  <span key={k} style={{ marginRight: 12 }}>
                    {k.replace(/_/g, ' ')}: <strong>{String(v)}</strong>
                  </span>
                ))}
              </div>
              {evt.notes && <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', marginTop: 4 }}>{evt.notes}</div>}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="hq-btn-primary" onClick={handleConfirm} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving...' : 'Confirm & save'}
            </button>
            <button className="hq-btn-secondary" onClick={handleDiscard} disabled={saving} style={{ flex: 1 }}>
              Discard
            </button>
          </div>
        </div>
      )}

      {parsed && parsed.length === 0 && (
        <div style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: 8, marginTop: 8, fontSize: 13 }}>
          No events could be extracted from your note. Try being more specific about what you did.
          <button className="hq-btn-secondary" onClick={handleDiscard} style={{ width: '100%', marginTop: 8 }}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
