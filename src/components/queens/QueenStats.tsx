import type { Queen } from '../../lib/database.types';
import { computeQueenStats, STAGE_LABELS, STAGE_COLORS, STAGES } from '../../lib/queens';
import { fmtMoney } from '../../lib/format';

interface Props {
  queens: Queen[];
}

export default function QueenStatsPanel({ queens }: Props) {
  const stats = computeQueenStats(queens);

  if (queens.length === 0) {
    return (
      <div className="hq-card" style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
        No queens yet. Start a graft to see stats here.
      </div>
    );
  }

  return (
    <>
      <div className="hq-boss-grid" style={{ marginBottom: 16 }}>
        <div className="hq-card hq-boss-tile">
          <span className="hq-kpi-label">Total queens</span>
          <span className="hq-kpi-value">{stats.totalQueens}</span>
        </div>
        <div className="hq-card hq-boss-tile">
          <span className="hq-kpi-label">Success rate</span>
          <span className="hq-kpi-value" style={{ color: stats.successRate >= 70 ? 'var(--strong)' : stats.successRate >= 50 ? 'var(--fair)' : 'var(--weak-text)' }}>
            {stats.successRate.toFixed(0)}%
          </span>
        </div>
        <div className="hq-card hq-boss-tile">
          <span className="hq-kpi-label">Cost / queen</span>
          <span className="hq-kpi-value">{fmtMoney(stats.costPerQueen)}</span>
        </div>
        <div className="hq-card hq-boss-tile">
          <span className="hq-kpi-label">Revenue</span>
          <span className="hq-kpi-value" style={{ color: 'var(--strong)' }}>{fmtMoney(stats.totalRevenue)}</span>
        </div>
      </div>

      <div className="hq-card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Pipeline breakdown</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STAGES.map(s => (
            <div key={s} style={{
              padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
              background: `${STAGE_COLORS[s]}20`, color: STAGE_COLORS[s],
              border: `1px solid ${STAGE_COLORS[s]}40`,
            }}>
              {STAGE_LABELS[s]}: {stats.byStage[s]}
            </div>
          ))}
        </div>
      </div>

      {stats.byLine.length > 0 && (
        <div className="hq-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Yield by line</h3>
          {stats.byLine.map(l => (
            <div key={l.line} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13,
            }}>
              <span style={{ fontWeight: 500 }}>{l.line}</span>
              <span style={{ color: 'var(--muted)' }}>
                {l.success}/{l.total} ({l.rate.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
