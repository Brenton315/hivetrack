import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

interface ChartPoint {
  site: string;
  [season: string]: string | number;
}

export default function HarvestChart() {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sites } = await supabase.from('sites').select('id, name').order('name');
      const { data: harvests } = await supabase
        .from('harvests')
        .select('site_id, season, kg, hive_id')
        .is('hive_id', null);

      if (!sites || !harvests) { setLoading(false); return; }

      const siteNames = new Map(sites.map((s: { id: string; name: string }) => [s.id, s.name]));
      const allSeasons = new Set<string>();
      const siteSeasonKg = new Map<string, Map<string, number>>();

      for (const h of harvests) {
        allSeasons.add(h.season);
        const siteName = siteNames.get(h.site_id) ?? h.site_id;
        if (!siteSeasonKg.has(siteName)) siteSeasonKg.set(siteName, new Map());
        const existing = siteSeasonKg.get(siteName)!.get(h.season) ?? 0;
        siteSeasonKg.get(siteName)!.set(h.season, existing + Number(h.kg));
      }

      const sortedSeasons = [...allSeasons].sort();
      const points: ChartPoint[] = [];

      for (const [siteName, seasonMap] of siteSeasonKg) {
        const point: ChartPoint = { site: siteName };
        for (const season of sortedSeasons) {
          point[season] = seasonMap.get(season) ?? 0;
        }
        points.push(point);
      }

      setChartData(points);
      setSeasons(sortedSeasons);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-3">Harvest by Site</h2>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400">No harvest data yet</div>
      ) : (
        <div className="bg-white rounded-2xl p-3 border border-gray-100">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="site" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'kg', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {seasons.map((season, i) => (
                <Bar key={season} dataKey={season} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
