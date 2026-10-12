const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(d: string | null): string {
  if (!d) return '-';
  const p = d.split('-');
  return `${Number(p[2])} ${MONTHS[Number(p[1]) - 1]} ${p[0]}`;
}

export function fmtDateShort(d: string | null): string {
  if (!d) return '-';
  const p = d.split('-');
  return `${Number(p[2])} ${MONTHS[Number(p[1]) - 1]}`;
}

export function queenAge(year: number | null): string {
  if (!year) return '-';
  const age = new Date().getFullYear() - year;
  if (age === 0) return 'New';
  return `${age}yr`;
}

export function fmtMoney(n: number): string {
  return '$' + n.toLocaleString('en-NZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function fmtRatio(n: number | null): string {
  if (n == null) return '-';
  return n.toFixed(2);
}
