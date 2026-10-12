import type { Harvest, Hive } from '../../lib/database.types';

interface Props {
  harvests: Harvest[];
  hives?: Hive[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function formatDate(d: string): string {
  const p = d.split('-');
  return `${Number(p[2])} ${MONTHS[Number(p[1]) - 1]} ${p[0]}`;
}

export default function HarvestList({ harvests, hives }: Props) {
  const hiveMap = new Map((hives ?? []).map((h) => [h.id, h.name]));

  if (harvests.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No harvests recorded</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {harvests.map((h) => (
        <div key={h.id} className="hq-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 500 }}>{formatDate(h.harvest_date)}</span>
            <span style={{ fontWeight: 600, color: 'var(--brand)' }}>{h.kg} kg</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 13, color: 'var(--ink-2)' }}>
            <span>Season: {h.season}</span>
            {h.honey_type && <span>{h.honey_type}</span>}
            {h.hive_id ? (
              <span>{hiveMap.get(h.hive_id) ?? 'Hive'}</span>
            ) : (
              <span>Site total</span>
            )}
          </div>

          {h.notes && (
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0 0' }}>{h.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}
