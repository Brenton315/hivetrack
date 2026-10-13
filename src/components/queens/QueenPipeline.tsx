import type { Queen, QueenStage } from '../../lib/database.types';
import { PIPELINE_STAGES, STAGE_LABELS, STAGE_COLORS, updateQueenStage } from '../../lib/queens';
import { fmtDateShort } from '../../lib/format';

interface Props {
  queens: Queen[];
  onRefresh: () => void;
  onSelect: (q: Queen) => void;
}

export default function QueenPipeline({ queens, onRefresh, onSelect }: Props) {
  const pipelineQueens = queens.filter(q => (PIPELINE_STAGES as string[]).includes(q.stage));

  async function moveStage(q: Queen, newStage: QueenStage) {
    try {
      await updateQueenStage(q.id, newStage);
      onRefresh();
    } catch {
      // silent — will show stale state until next refresh
    }
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'flex', gap: 12, minWidth: PIPELINE_STAGES.length * 200 }}>
        {PIPELINE_STAGES.map(stage => {
          const stageQueens = pipelineQueens.filter(q => q.stage === stage);
          const nextStage = PIPELINE_STAGES[PIPELINE_STAGES.indexOf(stage) + 1] as QueenStage | undefined;

          return (
            <div key={stage} style={{ flex: 1, minWidth: 180 }}>
              <div style={{
                padding: '6px 10px', borderRadius: '8px 8px 0 0',
                background: STAGE_COLORS[stage], color: '#fff',
                fontSize: 13, fontWeight: 600, display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{STAGE_LABELS[stage]}</span>
                <span style={{ opacity: 0.8 }}>{stageQueens.length}</span>
              </div>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--line)',
                borderTop: 'none', borderRadius: '0 0 8px 8px', minHeight: 100,
                padding: 6,
              }}>
                {stageQueens.length === 0 && (
                  <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
                    Empty
                  </div>
                )}
                {stageQueens.map(q => (
                  <div
                    key={q.id}
                    style={{
                      padding: '8px 10px', borderRadius: 6, background: 'var(--page)',
                      border: '1px solid var(--line)', marginBottom: 6, cursor: 'pointer',
                    }}
                  >
                    <div
                      onClick={() => onSelect(q)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{q.code}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{q.line}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {fmtDateShort(q.stage_date)}
                    </div>
                    {nextStage && (
                      <button
                        onClick={() => moveStage(q, nextStage)}
                        style={{
                          marginTop: 4, width: '100%', padding: '3px 0', fontSize: 11,
                          border: '1px solid var(--line)', borderRadius: 4,
                          background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer',
                        }}
                      >
                        → {STAGE_LABELS[nextStage]}
                      </button>
                    )}
                    {stage === 'laying' && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        <button
                          onClick={() => moveStage(q, 'introduced')}
                          style={{
                            flex: 1, padding: '3px 0', fontSize: 11,
                            border: '1px solid var(--strong)', borderRadius: 4,
                            background: 'var(--surface)', color: 'var(--strong)', cursor: 'pointer',
                          }}
                        >
                          Introduce
                        </button>
                        <button
                          onClick={() => moveStage(q, 'sold')}
                          style={{
                            flex: 1, padding: '3px 0', fontSize: 11,
                            border: '1px solid var(--muted)', borderRadius: 4,
                            background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer',
                          }}
                        >
                          Sell
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
