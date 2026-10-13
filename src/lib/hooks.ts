import { useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Site, Hive, HiveEvent, Harvest, InspectionData, CostData } from './database.types';
import { strengthFromFrames, status, average, type StrengthStatus } from './strength';
import { SETTINGS } from './settings';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  const user: User | null = session?.user ?? null;
  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  return { session, user, loading, signOut };
}

export function useSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('sites').select('*').order('name');
    setSites(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { sites, loading, refetch: fetch };
}

export function useSite(id: string | undefined) {
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase.from('sites').select('*').eq('id', id).single();
    setSite(data ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);
  return { site, loading, refetch: fetch };
}

export function useHives(siteId?: string) {
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('hives').select('*').order('name');
    if (siteId) query = query.eq('site_id', siteId);
    const { data } = await query;
    setHives(data ?? []);
    setLoading(false);
  }, [siteId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { hives, loading, refetch: fetch };
}

export function useHive(id: string | undefined) {
  const [hive, setHive] = useState<(Hive & { site_name?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase
      .from('hives')
      .select('*, sites(name)')
      .eq('id', id)
      .single();
    if (data) {
      const siteName = (data as Record<string, unknown>).sites
        ? ((data as Record<string, unknown>).sites as { name: string }).name
        : undefined;
      setHive({ ...data, site_name: siteName } as Hive & { site_name?: string });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);
  return { hive, loading, refetch: fetch };
}

export function useEvents(siteId?: string, hiveId?: string, eventType?: string) {
  const [events, setEvents] = useState<HiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('hive_events').select('*').order('event_date', { ascending: false });
    if (siteId) query = query.eq('site_id', siteId);
    if (hiveId) query = query.eq('hive_id', hiveId);
    if (eventType) query = query.eq('event_type', eventType);
    const { data } = await query;
    setEvents(data ?? []);
    setLoading(false);
  }, [siteId, hiveId, eventType]);

  useEffect(() => { fetch(); }, [fetch]);
  return { events, loading, refetch: fetch };
}

export function useAllEvents() {
  const [events, setEvents] = useState<HiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('hive_events').select('*').order('event_date', { ascending: false });
    setEvents(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { events, loading, refetch: fetch };
}

export function useHarvests(siteId?: string, hiveId?: string) {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('harvests').select('*').order('harvest_date', { ascending: false });
    if (siteId) query = query.eq('site_id', siteId);
    if (hiveId) query = query.eq('hive_id', hiveId);
    const { data } = await query;
    setHarvests(data ?? []);
    setLoading(false);
  }, [siteId, hiveId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { harvests, loading, refetch: fetch };
}

export interface HiveWithStrength {
  id: string;
  name: string;
  site_id: string;
  site_name: string;
  queen_breed: string | null;
  queen_year: number | null;
  strength: number | null;
  status: StrengthStatus | null;
  lastFed: string | null;
  lastFeedType: string | null;
  lastTreatment: string | null;
  lastTreatmentProduct: string | null;
  lastBoxAdded: string | null;
  lastBoxType: string | null;
  framesOfStores: number | null;
  framesOfBrood: number | null;
  storesBroodRatio: number | null;
  boxCount: number;
}

export interface SiteOverview {
  id: string;
  name: string;
  main_flowering: string | null;
  lat: number | null;
  lng: number | null;
  hiveCount: number;
  strength: number;
  status: StrengthStatus;
  lastHarvest: string | null;
  totalCost: number;
  costPerHive: number;
  hivesNeedingAttention: number;
}

export interface OverviewData {
  sites: SiteOverview[];
  hivesWithStrength: HiveWithStrength[];
  totalHives: number;
  overallStrength: number;
  counts: { strong: number; fair: number; weak: number };
  checkHives: HiveWithStrength[];
  lastHarvestDate: string | null;
  lastHarvestSite: string | null;
  totalCosts: number;
  totalRevenue: number;
  costByCategory: Record<string, number>;
  loading: boolean;
  refetch: () => void;
}

function computeHiveData(
  hive: Hive & { site_name: string },
  events: HiveEvent[]
): HiveWithStrength {
  const hiveEvents = events.filter(e => e.hive_id === hive.id);
  const sortedByDate = [...hiveEvents].sort((a, b) => b.event_date.localeCompare(a.event_date));

  const lastInspection = sortedByDate.find(e => e.event_type === 'inspection');
  const lastFeed = sortedByDate.find(e => e.event_type === 'feed');
  const lastTreatment = sortedByDate.find(e => e.event_type === 'treatment');
  const lastBox = sortedByDate.find(e => e.event_type === 'box_added');

  const inspData = lastInspection?.data as InspectionData | undefined;
  const str = inspData ? strengthFromFrames(inspData.frames_of_bees) : null;

  const boxEvents = hiveEvents.filter(e => e.event_type === 'box_added');
  const boxCount = boxEvents.length + 1;

  const stores = inspData?.frames_of_stores ?? null;
  const brood = inspData?.frames_of_brood ?? null;
  const ratio = stores != null && brood != null && brood > 0 ? Math.round((stores / brood) * 100) / 100 : null;

  return {
    id: hive.id,
    name: hive.name,
    site_id: hive.site_id,
    site_name: hive.site_name,
    queen_breed: hive.queen_breed,
    queen_year: hive.queen_year,
    strength: str,
    status: str != null ? status(str) : null,
    lastFed: lastFeed?.event_date ?? null,
    lastFeedType: (lastFeed?.data as Record<string, string>)?.feed_type ?? null,
    lastTreatment: lastTreatment?.event_date ?? null,
    lastTreatmentProduct: (lastTreatment?.data as Record<string, string>)?.product ?? null,
    lastBoxAdded: lastBox?.event_date ?? null,
    lastBoxType: (lastBox?.data as Record<string, string>)?.box_type ?? null,
    framesOfStores: stores,
    framesOfBrood: brood,
    storesBroodRatio: ratio,
    boxCount,
  };
}

export { computeHiveData };

export function useOverviewData(): OverviewData {
  const [data, setData] = useState<Omit<OverviewData, 'loading' | 'refetch'>>({
    sites: [], hivesWithStrength: [], totalHives: 0, overallStrength: 0,
    counts: { strong: 0, fair: 0, weak: 0 }, checkHives: [],
    lastHarvestDate: null, lastHarvestSite: null,
    totalCosts: 0, totalRevenue: 0, costByCategory: {},
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [sitesRes, hivesRes, eventsRes, harvestsRes] = await Promise.all([
        supabase.from('sites').select('*').order('name'),
        supabase.from('hives').select('*, sites(name)').order('name'),
        supabase.from('hive_events').select('*').order('event_date', { ascending: false }),
        supabase.from('harvests').select('site_id, harvest_date, kg').order('harvest_date', { ascending: false }),
      ]);

      const sitesData = sitesRes.data ?? [];
      const hivesData = hivesRes.data ?? [];
      const eventsData = eventsRes.data ?? [];
      const harvestsData = harvestsRes.data ?? [];

      if (!sitesData.length) { setLoading(false); return; }

      const hivesWithStrength: HiveWithStrength[] = hivesData.map((hive) => {
        const siteName = (hive as Record<string, unknown>).sites
          ? ((hive as Record<string, unknown>).sites as { name: string }).name : '';
        return computeHiveData({ ...hive, site_name: siteName } as Hive & { site_name: string }, eventsData);
      });

      const counts = { strong: 0, fair: 0, weak: 0 };
      const strengthValues: number[] = [];
      for (const h of hivesWithStrength) {
        if (h.strength != null && h.status) {
          counts[h.status]++;
          strengthValues.push(h.strength);
        }
      }

      const overallStrength = strengthValues.length ? Math.round(average(strengthValues)) : 0;

      const costEvents = eventsData.filter(e => e.event_type === 'cost');
      let totalCosts = 0;
      const costByCategory: Record<string, number> = {};
      for (const e of costEvents) {
        const d = e.data as CostData;
        const amt = d.amount ?? 0;
        totalCosts += amt;
        costByCategory[d.category] = (costByCategory[d.category] ?? 0) + amt;
      }

      let totalRevenue = 0;
      for (const h of harvestsData) { totalRevenue += Number(h.kg) * SETTINGS.revenue.honeyPricePerKg; }

      const lastHarvestBySite = new Map<string, string>();
      for (const h of harvestsData) {
        if (!lastHarvestBySite.has(h.site_id)) lastHarvestBySite.set(h.site_id, h.harvest_date);
      }

      const costBySite = new Map<string, number>();
      for (const e of costEvents) {
        costBySite.set(e.site_id, (costBySite.get(e.site_id) ?? 0) + ((e.data as CostData).amount ?? 0));
      }

      const siteOverviews: SiteOverview[] = sitesData.map((site: Site) => {
        const siteHives = hivesWithStrength.filter(h => h.site_id === site.id);
        const siteStrengths = siteHives.filter(h => h.strength != null).map(h => h.strength!);
        const pct = siteStrengths.length ? Math.round(average(siteStrengths)) : 0;
        const siteCost = costBySite.get(site.id) ?? 0;
        const needingAttention = siteHives.filter(h => h.strength != null && h.status !== 'strong').length;
        return {
          id: site.id, name: site.name, main_flowering: site.main_flowering,
          lat: site.lat, lng: site.lng,
          hiveCount: siteHives.length, strength: pct, status: status(pct),
          lastHarvest: lastHarvestBySite.get(site.id) ?? null,
          totalCost: siteCost,
          costPerHive: siteHives.length ? Math.round(siteCost / siteHives.length) : 0,
          hivesNeedingAttention: needingAttention,
        };
      });

      const checkHives = hivesWithStrength
        .filter(h => h.strength != null && h.status !== 'strong')
        .sort((a, b) => (a.strength ?? 0) - (b.strength ?? 0));

      let lastHarvestDate: string | null = null;
      let lastHarvestSite: string | null = null;
      if (harvestsData.length > 0) {
        lastHarvestDate = harvestsData[0].harvest_date;
        lastHarvestSite = sitesData.find((s: Site) => s.id === harvestsData[0].site_id)?.name ?? null;
      }

      setData({
        sites: siteOverviews, hivesWithStrength, totalHives: hivesData.length,
        overallStrength, counts, checkHives, lastHarvestDate, lastHarvestSite,
        totalCosts, totalRevenue, costByCategory,
      });
      setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { ...data, loading, refetch: fetchData };
}
