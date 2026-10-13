export interface Site {
  id: string;
  user_id: string;
  name: string;
  hive_count: number;
  lat: number | null;
  lng: number | null;
  location_text: string | null;
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

export type EventType = 'feed' | 'treatment' | 'box_added' | 'inspection' | 'move' | 'cost' | 'visit';

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
  method?: string;
}

export interface BoxAddedData {
  box_type: 'brood' | 'super';
  action?: 'added' | 'removed';
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

export interface VisitData {
  hive_count: number;
  strong: number;
  medium: number;
  weak: number;
  feeding_done: boolean;
  feeding_type?: string;
  feeding_quantity?: string;
  treatment_applied: boolean;
  treatment_product?: string;
  treatment_method?: string;
  boxes_added: number;
  boxes_removed: number;
  queen_events?: string;
  logged_by?: string;
  source: 'manual' | 'ai';
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
