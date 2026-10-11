import type { HiveLog, Hive } from '../../lib/database.types';

interface Props {
  logs: HiveLog[];
  hives?: Hive[];
}

export default function LogList({ logs, hives }: Props) {
  const hiveMap = new Map((hives ?? []).map((h) => [h.id, h.name]));

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });

  if (logs.length === 0) {
    return <p className="text-center text-gray-400 py-6">No log entries yet</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {logs.map((log) => (
        <div key={log.id} className="bg-white rounded-xl p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-900">
              {formatDate(log.log_date)}
            </span>
            {log.hive_id ? (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {hiveMap.get(log.hive_id) ?? 'Hive'}
              </span>
            ) : (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Whole site
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
            {log.frames_of_bees != null && (
              <span>🐝 {log.frames_of_bees} frames</span>
            )}
            {log.brood_stores_ratio && (
              <span>📊 {log.brood_stores_ratio}</span>
            )}
            {log.treatments && (
              <span>💊 {log.treatments}</span>
            )}
            {log.feeding && (
              <span>🍯 {log.feeding}</span>
            )}
          </div>

          {log.notes && (
            <p className="text-sm text-gray-500 mt-1">{log.notes}</p>
          )}
        </div>
      ))}
    </div>
  );
}
