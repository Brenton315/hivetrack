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
  site_id: string;
  queen_breed: string | null;
  queen_year: number | null;
  notes: string | null;
  created_at: string;
}

export type EventType = 'feed' | 'treatment' | 'box_added' | 'inspection' | 'move' | 'cost';

export interface HiveEvent {
  id: string;
  user_id: string;
  hive_id: string | null;
  site_id: string;
  event_type: EventType;
  event_date: string;
  data: Record<string, unknown>;
  notes: string | null;
  created_at: string;
}

export interface FeedData {
  feed_type: string;
  amount: string;
}

export interface TreatmentData {
  product: string;
}

export interface BoxAddedData {
  box_type: 'brood' | 'super';
}

export interface InspectionData {
  frames_of_bees: number;
  frames_of_stores: number;
  frames_of_brood: number;
}

export interface MoveData {
  from_site_id: string;
  to_site_id: string;
  from_site_name?: string;
  to_site_name?: string;
}

export interface CostData {
  category: string;
  amount: number;
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

