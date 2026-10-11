import type { Harvest, Hive } from '../../lib/database.types';

interface Props {
  harvests: Harvest[];
  hives?: Hive[];
}

export default function HarvestList({ harvests, hives }: Props) {
  const hiveMap = new Map((hives ?? []).map((h) => [h.id, h.name]));

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });

  if (harvests.length === 0) {
    return <p className="text-center text-gray-400 py-6">No harvests recorded</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {harvests.map((h) => (
        <div key={h.id} className="bg-white rounded-xl p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-900">{formatDate(h.harvest_date)}</span>
            <div className="flex items-center gap-2">
              {h.hive_id ? (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {hiveMap.get(h.hive_id) ?? 'Hive'}
                </span>
              ) : (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Site total
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
            <span className="font-semibold text-gray-900">🍯 {h.kg} kg</span>
            <span>Season: {h.season}</span>
            {h.honey_type && <span>{h.honey_type}</span>}
          </div>

          {h.notes && (
            <p className="text-sm text-gray-500 mt-1">{h.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}
