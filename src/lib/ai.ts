import { supabase } from './supabase';

export interface ParsedEvent {
  event_type: 'inspection' | 'feed' | 'treatment' | 'box_added' | 'cost' | 'visit';
  event_date: string | null;
  site_name: string | null;
  hive_name: string | null;
  data: Record<string, unknown>;
  notes: string | null;
  confidence: number;
}

export interface ParseResult {
  events: ParsedEvent[];
  usage: { input_tokens: number; output_tokens: number };
}

export interface AskResult {
  answer: string;
  usage: { input_tokens: number; output_tokens: number };
}

export interface DataSummary {
  sites: Array<{
    name: string;
    hive_count: number;
    strength: number;
    last_checked: string | null;
    overdue: boolean;
  }>;
  total_hives: number;
  total_revenue: number;
  total_costs: number;
  recent_events: Array<{
    type: string;
    date: string;
    site: string;
    notes: string | null;
  }>;
}

export async function parseNotes(notes: string[]): Promise<ParseResult> {
  const { data, error } = await supabase.functions.invoke('parse-note', {
    body: { notes },
  });

  if (error) throw new Error(error.message ?? 'Failed to parse notes');
  if (data?.error) throw new Error(data.error);
  return data as ParseResult;
}

export async function askQuestion(question: string, dataSummary: DataSummary): Promise<AskResult> {
  const { data, error } = await supabase.functions.invoke('ask-question', {
    body: { question, data_summary: dataSummary },
  });

  if (error) throw new Error(error.message ?? 'Failed to get answer');
  if (data?.error) throw new Error(data.error);
  return data as AskResult;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  inspection: 'Inspection',
  feed: 'Feeding',
  treatment: 'Treatment',
  box_added: 'Box change',
  cost: 'Cost',
  visit: 'Site visit',
};

export function eventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type;
}

export function confidenceLabel(c: number): string {
  if (c >= 0.9) return 'High';
  if (c >= 0.7) return 'Medium';
  return 'Low';
}

export function confidenceColor(c: number): string {
  if (c >= 0.9) return 'var(--strong)';
  if (c >= 0.7) return 'var(--fair)';
  return 'var(--weak-text)';
}
