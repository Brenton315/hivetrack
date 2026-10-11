import type { SiteWithDates } from '../../lib/database.types';

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function floweringBadge(f: string | null): string {
  if (!f) return '';
  const map: Record<string, string> = {
    'mānuka': 'bg-amber-100 text-amber-800',
    'manuka': 'bg-amber-100 text-amber-800',
    'kānuka': 'bg-emerald-100 text-emerald-800',
    'kanuka': 'bg-emerald-100 text-emerald-800',
    'clover': 'bg-pink-100 text-pink-800',
  };
  return map[f.toLowerCase()] ?? 'bg-gray-100 text-gray-700';
}

interface Props {
  site: SiteWithDates;
  onClick: () => void;
}

export default function SiteCard({ site, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 text-lg truncate">{site.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{site.hive_count} hives</span>
            {site.main_flowering && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${floweringBadge(site.main_flowering)}`}>
                {site.main_flowering}
              </span>
            )}
          </div>
        </div>
        <span className="text-2xl ml-2">🐝</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">Inspected</span>
          <p className="text-gray-700 font-medium">{formatDate(site.last_inspected)}</p>
        </div>
        <div>
          <span className="text-gray-400">Harvested</span>
          <p className="text-gray-700 font-medium">{formatDate(site.last_harvested)}</p>
        </div>
      </div>
    </button>
  );
}
