export const STRONG_MIN = 70;
export const FAIR_MIN = 50;
export const MAX_FRAMES = 10;

export type StrengthStatus = 'strong' | 'fair' | 'weak';

export function strengthFromFrames(frames: number | null): number | null {
  if (frames == null) return null;
  return Math.min(100, Math.round((frames / MAX_FRAMES) * 100));
}

export function status(pct: number): StrengthStatus {
  if (pct >= STRONG_MIN) return 'strong';
  if (pct >= FAIR_MIN) return 'fair';
  return 'weak';
}

export function statusLabel(s: StrengthStatus): string {
  return { strong: 'Strong', fair: 'Fair', weak: 'Weak' }[s];
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
