import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './hooks';
import type { Queen, QueenStage } from './database.types';

export const STAGES: QueenStage[] = [
  'graft', 'cell_builder', 'capped', 'mating_nuc', 'laying', 'introduced', 'sold', 'failed',
];

export const STAGE_LABELS: Record<QueenStage, string> = {
  graft: 'Graft',
  cell_builder: 'Cell Builder',
  capped: 'Capped',
  mating_nuc: 'Mating Nuc',
  laying: 'Laying',
  introduced: 'Introduced',
  sold: 'Sold',
  failed: 'Failed',
};

export const STAGE_COLORS: Record<QueenStage, string> = {
  graft: '#8b5cf6',
  cell_builder: '#3b82f6',
  capped: '#06b6d4',
  mating_nuc: '#f59e0b',
  laying: '#22c55e',
  introduced: '#10b981',
  sold: '#6b7280',
  failed: '#ef4444',
};

export const PIPELINE_STAGES: QueenStage[] = [
  'graft', 'cell_builder', 'capped', 'mating_nuc', 'laying',
];

export const TERMINAL_STAGES: QueenStage[] = ['introduced', 'sold', 'failed'];

export function useQueens() {
  const { user } = useAuth();
  const [queens, setQueens] = useState<Queen[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('queens')
      .select('*')
      .eq('user_id', user.id)
      .order('graft_date', { ascending: false });
    setQueens((data as Queen[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { queens, loading, refresh };
}

export async function createQueen(
  userId: string,
  q: Omit<Queen, 'id' | 'user_id' | 'created_at'>,
) {
  const { error } = await supabase.from('queens').insert({ ...q, user_id: userId });
  if (error) throw error;
}

export async function updateQueenStage(id: string, stage: QueenStage) {
  const { error } = await supabase
    .from('queens')
    .update({ stage, stage_date: new Date().toISOString().slice(0, 10) })
    .eq('id', id);
  if (error) throw error;
}

export async function updateQueen(id: string, updates: Partial<Queen>) {
  const { error } = await supabase.from('queens').update(updates).eq('id', id);
  if (error) throw error;
}

export interface QueenStats {
  totalQueens: number;
  byStage: Record<QueenStage, number>;
  successRate: number;
  totalCost: number;
  totalRevenue: number;
  costPerQueen: number;
  byLine: Array<{ line: string; total: number; success: number; rate: number }>;
  needRequeening: number;
}

export function computeQueenStats(queens: Queen[]): QueenStats {
  const byStage = Object.fromEntries(STAGES.map(s => [s, 0])) as Record<QueenStage, number>;
  queens.forEach(q => { byStage[q.stage]++; });

  const completed = queens.filter(q => TERMINAL_STAGES.includes(q.stage));
  const successful = queens.filter(q => q.stage === 'introduced' || q.stage === 'sold');
  const successRate = completed.length > 0 ? (successful.length / completed.length) * 100 : 0;

  const totalCost = queens.reduce((sum, q) => sum + (q.cost ?? 0), 0);
  const totalRevenue = queens.filter(q => q.sold_price).reduce((sum, q) => sum + (q.sold_price ?? 0), 0);
  const costPerQueen = queens.length > 0 ? totalCost / queens.length : 0;

  const lineMap = new Map<string, { total: number; success: number }>();
  queens.forEach(q => {
    const entry = lineMap.get(q.line) ?? { total: 0, success: 0 };
    entry.total++;
    if (q.stage === 'introduced' || q.stage === 'sold') entry.success++;
    lineMap.set(q.line, entry);
  });

  const byLine = Array.from(lineMap.entries())
    .map(([line, { total, success }]) => ({
      line, total, success, rate: total > 0 ? (success / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalQueens: queens.length,
    byStage,
    successRate,
    totalCost,
    totalRevenue,
    costPerQueen,
    byLine,
    needRequeening: 0,
  };
}
