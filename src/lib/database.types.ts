export interface Site {
  id: string;
  user_id: string;
  name: string;
  hive_count: number;
  lat: number | null;
  lng: number | null;
  location_text: string | null;
  main_flowering: string | null;
  created_at: string;
}

export interface Hive {
  id: string;
  user_id: string;
  name: string;
  site_id: string | null;
  created_at: string;
}

export interface HiveLog {
  id: string;
  user_id: string;
  hive_id: string | null;
  site_id: string;
  log_date: string;
  frames_of_bees: number | null;
  treatments: string | null;
  feeding: string | null;
  brood_stores_ratio: string | null;
  notes: string | null;
  created_at: string;
}

export interface Harvest {
  id: string;
  user_id: string;
  hive_id: string | null;
  site_id: string;
  season: string;
  harvest_date: string;
  kg: number;
  honey_type: string | null;
  notes: string | null;
  created_at: string;
}

export interface SiteWithDates extends Site {
  last_inspected: string | null;
  last_harvested: string | null;
}

export interface HiveLogWithNames extends HiveLog {
  hive_name?: string;
  site_name?: string;
}

export interface HarvestWithNames extends Harvest {
  hive_name?: string;
  site_name?: string;
}
