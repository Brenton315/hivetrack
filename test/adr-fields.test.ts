/**
 * Tests for ADR (Apiary Disease Return) form field validation.
 * Run with: npx tsx test/adr-fields.test.ts
 */

interface AdrData {
  beekeeper_name: string;
  beekeeper_id: string;
  address: string;
  phone: string;
  email: string;
  season: string;
  total_apiaries: number;
  total_hives: number;
  afb_found: boolean;
  afb_hives_destroyed: number;
  treatments_used: string;
  varroa_treatments: string;
  hives_moved: boolean;
  movement_details: string;
  declaration_date: string;
}

const REQUIRED_FIELDS: (keyof AdrData)[] = ['beekeeper_name', 'beekeeper_id', 'season', 'total_apiaries', 'total_hives', 'declaration_date'];

function validateAdr(data: AdrData): string[] {
  const errors: string[] = [];

  if (!data.beekeeper_name.trim()) errors.push('beekeeper_name is required');
  if (!data.beekeeper_id.trim()) errors.push('beekeeper_id is required');
  if (!data.season.trim()) errors.push('season is required');
  if (data.total_apiaries < 0) errors.push('total_apiaries must be non-negative');
  if (data.total_hives < 0) errors.push('total_hives must be non-negative');
  if (data.afb_found && data.afb_hives_destroyed < 0) errors.push('afb_hives_destroyed must be non-negative when AFB found');
  if (!data.declaration_date) errors.push('declaration_date is required');
  if (data.declaration_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.declaration_date)) errors.push('declaration_date must be YYYY-MM-DD');
  if (data.season && !/^\d{4}\/\d{4}$/.test(data.season)) errors.push('season must be YYYY/YYYY format');

  return errors;
}

const VALID_ADR: AdrData = {
  beekeeper_name: 'John Smith',
  beekeeper_id: 'BK-12345',
  address: '123 Rural Road, Northland',
  phone: '021 123 4567',
  email: 'john@example.com',
  season: '2025/2026',
  total_apiaries: 4,
  total_hives: 48,
  afb_found: false,
  afb_hives_destroyed: 0,
  treatments_used: '',
  varroa_treatments: 'Apivar, oxalic acid',
  hives_moved: true,
  movement_details: 'Moved 6 hives from Valley to Hilltop in March',
  declaration_date: '2026-06-01',
};

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL: ${name} — ${err instanceof Error ? err.message : err}`);
  }
}

console.log('ADR Field Validation Tests\n');

console.log('Valid data:');
test('valid ADR passes validation', () => {
  const errors = validateAdr(VALID_ADR);
  if (errors.length > 0) throw new Error(`unexpected errors: ${errors.join(', ')}`);
});

console.log('\nRequired fields:');
for (const field of REQUIRED_FIELDS) {
  test(`${field} is required`, () => {
    const data = { ...VALID_ADR };
    if (typeof data[field] === 'string') (data as Record<string, unknown>)[field] = '';
    else if (typeof data[field] === 'number') (data as Record<string, unknown>)[field] = -1;
    const errors = validateAdr(data);
    if (errors.length === 0) throw new Error(`expected validation error for empty ${field}`);
  });
}

console.log('\nDate format:');
test('rejects invalid date format', () => {
  const data = { ...VALID_ADR, declaration_date: '01/06/2026' };
  const errors = validateAdr(data);
  if (!errors.some(e => e.includes('YYYY-MM-DD'))) throw new Error('expected date format error');
});

test('accepts valid date', () => {
  const errors = validateAdr(VALID_ADR);
  if (errors.some(e => e.includes('date'))) throw new Error('unexpected date error');
});

console.log('\nSeason format:');
test('rejects invalid season format', () => {
  const data = { ...VALID_ADR, season: '2025-2026' };
  const errors = validateAdr(data);
  if (!errors.some(e => e.includes('YYYY/YYYY'))) throw new Error('expected season format error');
});

console.log('\nAFB fields:');
test('afb_hives_destroyed required when AFB found', () => {
  const data = { ...VALID_ADR, afb_found: true, afb_hives_destroyed: -1 };
  const errors = validateAdr(data);
  if (!errors.some(e => e.includes('afb_hives_destroyed'))) throw new Error('expected AFB error');
});

test('afb fields not required when no AFB', () => {
  const data = { ...VALID_ADR, afb_found: false, afb_hives_destroyed: 0 };
  const errors = validateAdr(data);
  if (errors.some(e => e.includes('afb'))) throw new Error('unexpected AFB error');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
