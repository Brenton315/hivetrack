import { useState } from 'react';
import { useQueens, STAGE_LABELS, STAGE_COLORS, TERMINAL_STAGES, updateQueenStage } from '../../lib/queens';
import type { Queen, QueenStage } from '../../lib/database.types';
import { fmtDateShort } from '../../lib/format';
import Logo from '../layout/Logo';
import QueenPipeline from './QueenPipeline';
import QueenStatsPanel from './QueenStats';
import QueenForm from './QueenForm';

type Tab = 'pipeline' | 'all' | 'stats';

function QueenDetailModal({ queen, queens, onClose, onRefresh }: { queen: Queen; queens: Queen[]; onClose: () => void; onRefresh: () => void }) {
  const mother = queen.mother_id ? queens.find(q => q.id === queen.mother_id) : null;
  const daughters = queens.filter(q => q.mother_id === queen.id);

  async function handleStageChange(stage: QueenStage) {
    await updateQueenStage(queen.id, stage);
    onRefresh();
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--page)', borderRadius: 12, padding: 20, maxWidth: 420,
        width: '100%', maxHeight: '80vh', overflow: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{queen.code}</h2>
          <span style={{
            padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
            background: `${STAGE_COLORS[queen.stage]}20`, color: STAGE_COLORS[queen.stage],
          }}>
            {STAGE_LABELS[queen.stage]}
          </span>
        </div>

        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
          <div>Line: <strong style={{ color: 'var(--ink)' }}>{queen.line}</strong></div>
          <div>Grafted: {fmtDateShort(queen.graft_date)}</div>
          <div>Stage since: {fmtDateShort(queen.stage_date)}</div>
          {mother && <div>Mother: <strong style={{ color: 'var(--ink)' }}>{mother.code}</strong> ({mother.line})</div>}
          {queen.notes && <div style={{ marginTop: 4, fontStyle: 'italic' }}>{queen.notes}</div>}
        </div>

        {daughters.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>Daughters ({daughters.length})</span>
            {daughters.map(d => (
              <div key={d.id} style={{ fontSize: 12, color: 'var(--muted)', padding: '2px 0' }}>
                {d.code} — {STAGE_LABELS[d.stage]}
              </div>
            ))}
          </div>
        )}

        {!TERMINAL_STAGES.includes(queen.stage) && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>Move to stage</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(['graft', 'cell_builder', 'capped', 'mating_nuc', 'laying', 'introduced', 'sold', 'failed'] as QueenStage[])
                .filter(s => s !== queen.stage)
                .map(s => (
                  <button
                    key={s}
                    onClick={() => handleStageChange(s)}
                    style={{
                      padding: '4px 10px', borderRadius: 8, fontSize: 12,
                      border: `1px solid ${STAGE_COLORS[s]}`, background: 'var(--surface)',
                      color: STAGE_COLORS[s], cursor: 'pointer',
                    }}
                  >
                    {STAGE_LABELS[s]}
                  </button>
                ))}
            </div>
          </div>
        )}

        <button className="hq-btn-secondary" onClick={onClose} style={{ width: '100%' }}>Close</button>
      </div>
    </div>
  );
}

export default function QueenPage() {
  const { queens, loading, refresh } = useQueens();
  const [tab, setTab] = useState<Tab>('pipeline');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Queen | null>(null);

  if (loading) {
    return (
      <>
        <header className="hq-header">
          <div className="hq-brand"><Logo size={26} /><span className="hq-wordmark">hivehq</span></div>
          <div className="hq-title"><h1>Queen Rearing</h1></div>
        </header>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
      </>
    );
  }

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand"><Logo size={26} /><span className="hq-wordmark">hivehq</span></div>
        <div className="hq-title"><h1>Queen Rearing</h1></div>
        <div className="hq-actions">
          <button className="hq-btn-primary" onClick={() => setShowForm(true)} style={{ fontSize: 13 }}>
            + New graft
          </button>
        </div>
      </header>

      <div className="hq-tabs" role="tablist" style={{ marginBottom: 16 }}>
        <button role="tab" aria-selected={tab === 'pipeline'} className={`hq-tab ${tab === 'pipeline' ? 'active' : ''}`} onClick={() => setTab('pipeline')}>
          Pipeline
        </button>
        <button role="tab" aria-selected={tab === 'all'} className={`hq-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          All queens
        </button>
        <button role="tab" aria-selected={tab === 'stats'} className={`hq-tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          Stats
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: 16 }}>
          <QueenForm queens={queens} onDone={() => { setShowForm(false); refresh(); }} />
        </div>
      )}

      {tab === 'pipeline' && (
        <QueenPipeline queens={queens} onRefresh={refresh} onSelect={setSelected} />
      )}

      {tab === 'all' && (
        <div className="hq-card" style={{ paddingBottom: 8 }}>
          <div className="hq-card-head"><h2>All queens ({queens.length})</h2></div>
          {queens.length === 0 && <p className="hq-empty">No queens yet.</p>}
          {queens.map(q => (
            <button
              key={q.id}
              className="hq-trow"
              style={{ gridTemplateColumns: 'minmax(0,1fr) 100px 80px 60px' }}
              onClick={() => setSelected(q)}
            >
              <div>
                <span className="hq-site-name">{q.code}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>{q.line}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDateShort(q.graft_date)}</div>
              <div>
                <span style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500,
                  background: `${STAGE_COLORS[q.stage]}20`, color: STAGE_COLORS[q.stage],
                }}>
                  {STAGE_LABELS[q.stage]}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
                ${q.cost}
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === 'stats' && <QueenStatsPanel queens={queens} />}

      {selected && (
        <QueenDetailModal
          queen={selected}
          queens={queens}
          onClose={() => setSelected(null)}
          onRefresh={refresh}
        />
      )}
    </>
  );
}
