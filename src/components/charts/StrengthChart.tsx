import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import type { Site, InspectionData } from '../../lib/database.types';

const COLORS = ['#2F7D5B', '#1D4A38', '#E9A820', '#B4441C', '#5FC08E', '#8B6B3D', '#3A7CA5', '#D4614A'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
    const { data: events } = await supabase
      .from('hive_events')
      .select('site_id, event_date, data')
      .eq('event_type', 'inspection')
      .order('event_date');

    if (!events || events.length === 0) { setChartData([]); setLineKeys([]); setLoading(false); return; }

    const siteNames = new Map(sites.map((s) => [s.id, s.name]));
    const dateMap = new Map<string, Map<string, number[]>>();

    for (const ev of events) {
      const d = ev.data as InspectionData;
      if (d.frames_of_bees == null) continue;
      const siteName = siteNames.get(ev.site_id) ?? ev.site_id;
      if (!dateMap.has(ev.event_date)) dateMap.set(ev.event_date, new Map());
      const siteMap = dateMap.get(ev.event_date)!;
      if (!siteMap.has(siteName)) siteMap.set(siteName, []);
      siteMap.get(siteName)!.push(d.frames_of_bees);
    }

    const keys = [...new Set(events.map((e) => siteNames.get(e.site_id) ?? e.site_id))];
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
    const { data: events } = await supabase
      .from('hive_events')
      .select('hive_id, event_date, data')
      .eq('site_id', siteId)
      .eq('event_type', 'inspection')
      .order('event_date');

    const { data: hives } = await supabase
      .from('hives')
      .select('id, name')
      .eq('site_id', siteId);

    if (!events || events.length === 0) { setChartData([]); setLineKeys([]); setLoading(false); return; }

    const hiveNames = new Map((hives ?? []).map((h: { id: string; name: string }) => [h.id, h.name]));
    const dateMap = new Map<string, Map<string, number>>();

    for (const ev of events) {
      const d = ev.data as InspectionData;
      if (d.frames_of_bees == null) continue;
      const label = ev.hive_id ? (hiveNames.get(ev.hive_id) ?? 'Unknown') : 'Site avg';
      if (!dateMap.has(ev.event_date)) dateMap.set(ev.event_date, new Map());
      dateMap.get(ev.event_date)!.set(label, d.frames_of_bees);
    }

    const keys = [...new Set(events.map((e) => e.hive_id ? (hiveNames.get(e.hive_id) ?? 'Unknown') : 'Site avg'))];
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

  function formatDate(d: string): string {
    const p = d.split('-');
    return `${Number(p[2])} ${MONTHS[Number(p[1]) - 1]}`;
  }

  return (
    <div>
      <div className="hq-card-head" style={{ padding: '0 0 12px' }}>
        <h2>Strength Over Time</h2>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        <button
          onClick={() => setSelectedSiteId(null)}
          className={!selectedSiteId ? 'hq-btn-primary' : 'hq-btn-secondary'}
          style={{ borderRadius: 20 }}
        >
          All sites
        </button>
        {sites.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSiteId(s.id)}
            className={selectedSiteId === s.id ? 'hq-btn-primary' : 'hq-btn-secondary'}
            style={{ borderRadius: 20 }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading...</div>
      ) : chartData.length === 0 ? (
        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>No strength data yet</div>
      ) : (
        <div className="hq-card" style={{ padding: 16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line-2)" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} label={{ value: 'Frames', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: 'var(--muted)' } }} />
              <Tooltip labelFormatter={(label) => formatDate(String(label))} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 6 }} />
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
