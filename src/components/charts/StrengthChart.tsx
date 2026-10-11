import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import type { Site } from '../../lib/database.types';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface ChartPoint {
  date: string;
  [key: string]: string | number | null;
}

export default function StrengthChart() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [lineKeys, setLineKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('sites').select('*').order('name');
      setSites(data ?? []);
    })();
  }, []);

  const loadSiteLevel = useCallback(async () => {
    setLoading(true);
    const { data: logs } = await supabase
      .from('hive_logs')
      .select('site_id, log_date, frames_of_bees')
      .not('frames_of_bees', 'is', null)
      .order('log_date');

    if (!logs || logs.length === 0) { setChartData([]); setLineKeys([]); setLoading(false); return; }

    const siteNames = new Map(sites.map((s) => [s.id, s.name]));
    const dateMap = new Map<string, Map<string, number[]>>();

    for (const log of logs) {
      const siteName = siteNames.get(log.site_id) ?? log.site_id;
      if (!dateMap.has(log.log_date)) dateMap.set(log.log_date, new Map());
      const siteMap = dateMap.get(log.log_date)!;
      if (!siteMap.has(siteName)) siteMap.set(siteName, []);
      siteMap.get(siteName)!.push(log.frames_of_bees!);
    }

    const keys = [...new Set(logs.map((l) => siteNames.get(l.site_id) ?? l.site_id))];
    const points: ChartPoint[] = [];

    for (const [date, siteMap] of dateMap) {
      const point: ChartPoint = { date };
      for (const [name, values] of siteMap) {
        point[name] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
      }
      points.push(point);
    }

    setChartData(points);
    setLineKeys(keys);
    setLoading(false);
  }, [sites]);

  const loadHiveLevel = useCallback(async (siteId: string) => {
    setLoading(true);
    const { data: logs } = await supabase
      .from('hive_logs')
      .select('hive_id, log_date, frames_of_bees')
      .eq('site_id', siteId)
      .not('frames_of_bees', 'is', null)
      .order('log_date');

    const { data: hives } = await supabase
      .from('hives')
      .select('id, name')
      .eq('site_id', siteId);

    if (!logs || logs.length === 0) { setChartData([]); setLineKeys([]); setLoading(false); return; }

    const hiveNames = new Map((hives ?? []).map((h: { id: string; name: string }) => [h.id, h.name]));
    const dateMap = new Map<string, Map<string, number>>();

    for (const log of logs) {
      const label = log.hive_id ? (hiveNames.get(log.hive_id) ?? 'Unknown') : 'Site avg';
      if (!dateMap.has(log.log_date)) dateMap.set(log.log_date, new Map());
      dateMap.get(log.log_date)!.set(label, log.frames_of_bees!);
    }

    const keys = [...new Set(logs.map((l) => l.hive_id ? (hiveNames.get(l.hive_id) ?? 'Unknown') : 'Site avg'))];
    const points: ChartPoint[] = [];
    for (const [date, hiveMap] of dateMap) {
      const point: ChartPoint = { date };
      for (const [name, val] of hiveMap) point[name] = val;
      points.push(point);
    }

    setChartData(points);
    setLineKeys(keys);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (sites.length === 0) return;
    if (selectedSiteId) {
      loadHiveLevel(selectedSiteId);
    } else {
      loadSiteLevel();
    }
  }, [sites, selectedSiteId, loadSiteLevel, loadHiveLevel]);

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-3">Strength Over Time</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedSiteId(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !selectedSiteId ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          All sites
        </button>
        {sites.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSiteId(s.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedSiteId === s.id ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400">No strength data yet</div>
      ) : (
        <div className="bg-white rounded-2xl p-3 border border-gray-100">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Frames', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
              <Tooltip labelFormatter={(label) => formatDate(String(label))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {lineKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
