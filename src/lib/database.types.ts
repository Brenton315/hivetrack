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

export type HiveStatus = 'active' | 'dead' | 'merged' | 'deleted' | 'sold';
export type DeletionReason = 'disease' | 'merged' | 'died' | 'sold' | 'other';
export type DeletionDisease = 'AFB' | 'EFB' | 'nosema' | 'varroa' | 'chalkbrood' | 'other';

export interface Hive {
  id: string;
  user_id: string;
  name: string;
  site_id: string;
  queen_breed: string | null;
  queen_year: number | null;
  notes: string | null;
  hive_lat: number | null;
  hive_lng: number | null;
  status: HiveStatus;
  deleted_at: string | null;
  deletion_reason: DeletionReason | null;
  deletion_disease: DeletionDisease | null;
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

export type OrgRole = 'owner' | 'head_beekeeper' | 'staff';

export interface Organization {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
}

export interface Membership {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export type QueenStage =
  | 'graft'
  | 'cell_builder'
  | 'capped'
  | 'mating_nuc'
  | 'laying'
  | 'introduced'
  | 'sold'
  | 'failed';

export interface Queen {
  id: string;
  user_id: string;
  code: string;
  line: string;
  mother_id: string | null;
  graft_date: string;
  stage: QueenStage;
  stage_date: string;
  hive_id: string | null;
  site_id: string | null;
  notes: string | null;
  cost: number;
  sold_price: number | null;
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

export type InventoryCategory = 'feed' | 'treatment' | 'equipment' | 'protective_gear' | 'other';

export interface InventoryItem {
  id: string;
  user_id: string;
  product_name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  min_stock: number;
  supplier: string | null;
  cost_per_unit: number;
  last_restocked: string | null;
  notes: string | null;
  created_at: string;
}

export interface InventoryUsage {
  id: string;
  user_id: string;
  inventory_id: string;
  quantity_used: number;
  used_date: string;
  site_id: string | null;
  hive_id: string | null;
  notes: string | null;
  created_at: string;
}
