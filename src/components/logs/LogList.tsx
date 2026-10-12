import type { HiveLog, Hive } from '../../lib/database.types';

interface Props {
  logs: HiveLog[];
  hives?: Hive[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function formatDate(d: string): string {
  const p = d.split('-');
  return `${Number(p[2])} ${MONTHS[Number(p[1]) - 1]} ${p[0]}`;
}

export default function LogList({ logs, hives }: Props) {
  const hiveMap = new Map((hives ?? []).map((h) => [h.id, h.name]));

  if (logs.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No log entries yet</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {logs.map((log) => (
        <div key={log.id} className="hq-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 500 }}>{formatDate(log.log_date)}</span>
            {log.hive_id ? (
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--brand)', background: 'var(--hover)', padding: '2px 8px', borderRadius: 12 }}>
                {hiveMap.get(log.hive_id) ?? 'Hive'}
              </span>
            ) : (
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', background: 'var(--hover)', padding: '2px 8px', borderRadius: 12 }}>
                Whole site
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 13, color: 'var(--ink-2)' }}>
            {log.frames_of_bees != null && <span>{log.frames_of_bees} frames</span>}
            {log.brood_stores_ratio && <span>B:S {log.brood_stores_ratio}</span>}
            {log.treatments && <span>Tx: {log.treatments}</span>}
            {log.feeding && <span>Feed: {log.feeding}</span>}
          </div>

          {log.notes && (
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0 0' }}>{log.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}
