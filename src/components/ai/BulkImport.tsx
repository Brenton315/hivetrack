import { useState } from 'react';
import { parseNotes, eventTypeLabel, confidenceLabel, confidenceColor } from '../../lib/ai';
import type { ParsedEvent } from '../../lib/ai';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/hooks';

export default function BulkImport() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedEvent[] | null>(null);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ saved: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function splitNotes(raw: string): string[] {
    return raw
      .split(/\n{2,}|(?:^|\n)---(?:\n|$)/m)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  async function handleParse() {
    const notes = splitNotes(text);
    if (notes.length === 0) return;
    if (notes.length > 30) {
      setError('Maximum 30 notes per batch. Split your notes into smaller batches.');
      return;
    }
    setError(null);
    setParsed(null);
    setRemoved(new Set());
    setResult(null);
    setParsing(true);
    try {
      const res = await parseNotes(notes);
      setParsed(res.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
    } finally {
      setParsing(false);
    }
  }

  function toggleRemove(i: number) {
    setRemoved(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
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

      let skipped = 0;
      const rows = parsed
        .filter((_, i) => !removed.has(i))
        .map(evt => {
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

          if (!siteId) { skipped++; return null; }

          return {
            user_id: user.id,
            hive_id: hiveId,
            site_id: siteId,
            event_type: evt.event_type,
            event_date: evt.event_date ?? new Date().toISOString().slice(0, 10),
            data: { ...evt.data, source: 'ai' },
            notes: evt.notes,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (rows.length > 0) {
        const { error: insertErr } = await supabase.from('hive_events').insert(rows);
        if (insertErr) throw insertErr;
      }

      setResult({ saved: rows.length, skipped });
      setText('');
      setParsed(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const activeCount = parsed ? parsed.length - removed.size : 0;

  return (
    <div className="hq-card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Bulk import</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
        Paste multiple field notes separated by blank lines. AI will parse all of them at once (max 30).
      </p>

      {result && (
        <div style={{ padding: '10px 14px', background: 'var(--strong)', color: '#fff', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
          {result.saved} event{result.saved !== 1 ? 's' : ''} saved.
          {result.skipped > 0 && ` ${result.skipped} skipped (unmatched site).`}
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
            placeholder={`Note 1: Checked Riverside today, all hives strong...\n\nNote 2: Hilltop apiary — fed sugar syrup...\n\nNote 3: Treated Valley site with oxalic acid...`}
            rows={8}
            style={{
              width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--line)',
              background: 'var(--surface)', color: 'var(--ink)', fontSize: 14,
              fontFamily: 'inherit', resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {splitNotes(text).length} note{splitNotes(text).length !== 1 ? 's' : ''} detected
            </span>
            <button
              className="hq-btn-primary"
              onClick={handleParse}
              disabled={parsing || splitNotes(text).length === 0}
            >
              {parsing ? 'Parsing...' : 'Parse all'}
            </button>
          </div>
        </>
      )}

      {parsed && parsed.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
            {parsed.length} event{parsed.length !== 1 ? 's' : ''} extracted — tap to exclude, then confirm:
          </p>
          {parsed.map((evt, i) => (
            <button
              key={i}
              onClick={() => toggleRemove(i)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', borderRadius: 8, border: '1px solid var(--line)',
                marginBottom: 6, background: removed.has(i) ? 'var(--line)' : 'var(--surface)',
                opacity: removed.has(i) ? 0.5 : 1, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>
                  {removed.has(i) ? '✕ ' : ''}{eventTypeLabel(evt.event_type)}
                  {evt.site_name ? ` — ${evt.site_name}` : ''}
                </span>
                <span style={{ fontSize: 11, color: confidenceColor(evt.confidence) }}>
                  {confidenceLabel(evt.confidence)}
                </span>
              </div>
              {evt.notes && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{evt.notes}</div>}
            </button>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="hq-btn-primary" onClick={handleConfirm} disabled={saving || activeCount === 0} style={{ flex: 1 }}>
              {saving ? 'Saving...' : `Confirm ${activeCount} event${activeCount !== 1 ? 's' : ''}`}
            </button>
            <button className="hq-btn-secondary" onClick={() => { setParsed(null); setRemoved(new Set()); }} disabled={saving} style={{ flex: 1 }}>
              Discard
            </button>
          </div>
        </div>
      )}

      {parsed && parsed.length === 0 && (
        <div style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: 8, marginTop: 8, fontSize: 13 }}>
          No events could be extracted. Try more descriptive notes.
          <button className="hq-btn-secondary" onClick={() => setParsed(null)} style={{ width: '100%', marginTop: 8 }}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
