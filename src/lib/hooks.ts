import { useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Site, SiteWithDates, Hive, HiveLog, Harvest } from './database.types';

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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { session, user, loading, signOut };
}

export function useSites() {
  const [sites, setSites] = useState<SiteWithDates[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: sitesData } = await supabase
      .from('sites')
      .select('*')
      .order('name');

    if (!sitesData) { setLoading(false); return; }

    const enriched: SiteWithDates[] = await Promise.all(
      sitesData.map(async (site: Site) => {
        const { data: logData } = await supabase
          .from('hive_logs')
          .select('log_date')
          .eq('site_id', site.id)
          .order('log_date', { ascending: false })
          .limit(1);

        const { data: harvestData } = await supabase
          .from('harvests')
          .select('harvest_date')
          .eq('site_id', site.id)
          .order('harvest_date', { ascending: false })
          .limit(1);

        return {
          ...site,
          last_inspected: logData?.[0]?.log_date ?? null,
          last_harvested: harvestData?.[0]?.harvest_date ?? null,
        };
      })
    );

    setSites(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { sites, loading, refetch: fetch };
}

export function useSite(id: string | undefined) {
  const [site, setSite] = useState<SiteWithDates | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data } = await supabase
      .from('sites')
      .select('*')
      .eq('id', id)
      .single();

    if (!data) { setLoading(false); return; }

    const { data: logData } = await supabase
      .from('hive_logs')
      .select('log_date')
      .eq('site_id', id)
      .order('log_date', { ascending: false })
      .limit(1);

    const { data: harvestData } = await supabase
      .from('harvests')
      .select('harvest_date')
      .eq('site_id', id)
      .order('harvest_date', { ascending: false })
      .limit(1);

    setSite({
      ...data,
      last_inspected: logData?.[0]?.log_date ?? null,
      last_harvested: harvestData?.[0]?.harvest_date ?? null,
    });
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

export function useLogs(siteId?: string, hiveId?: string) {
  const [logs, setLogs] = useState<HiveLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('hive_logs').select('*').order('log_date', { ascending: false });
    if (siteId) query = query.eq('site_id', siteId);
    if (hiveId) query = query.eq('hive_id', hiveId);
    const { data } = await query;
    setLogs(data ?? []);
    setLoading(false);
  }, [siteId, hiveId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { logs, loading, refetch: fetch };
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

export function useHiveSiteHistory(hiveId: string | undefined) {
  const [history, setHistory] = useState<{ site_id: string; site_name: string; first_date: string; last_date: string }[]>([]);

  useEffect(() => {
    if (!hiveId) return;
    (async () => {
      const { data: logs } = await supabase
        .from('hive_logs')
        .select('site_id, log_date')
        .eq('hive_id', hiveId)
        .order('log_date');

      if (!logs || logs.length === 0) return;

      const siteIds = [...new Set(logs.map((l: { site_id: string }) => l.site_id))];
      const { data: sitesData } = await supabase
        .from('sites')
        .select('id, name')
        .in('id', siteIds);

      const nameMap = new Map((sitesData ?? []).map((s: { id: string; name: string }) => [s.id, s.name]));

      const grouped = new Map<string, { first: string; last: string }>();
      for (const log of logs) {
        const existing = grouped.get(log.site_id);
        if (!existing) {
          grouped.set(log.site_id, { first: log.log_date, last: log.log_date });
        } else {
          existing.last = log.log_date;
        }
      }

      setHistory(
        Array.from(grouped.entries()).map(([siteId, dates]) => ({
          site_id: siteId,
          site_name: nameMap.get(siteId) ?? 'Unknown',
          first_date: dates.first,
          last_date: dates.last,
        }))
      );
    })();
  }, [hiveId]);

  return history;
}
