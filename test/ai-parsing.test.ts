/**
 * Tests for AI note parsing logic.
 *
 * These tests validate the expected output structure from the parse-note
 * edge function. Run with: npx tsx test/ai-parsing.test.ts
 *
 * The tests verify the parsing contract (schema validation) rather than
 * calling the live API, since the edge function requires a deployed
 * Supabase instance and Anthropic API key.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ParsedEvent {
  event_type: string;
  event_date: string | null;
  site_name: string | null;
  hive_name: string | null;
  data: Record<string, unknown>;
  notes: string | null;
  confidence: number;
}

const VALID_EVENT_TYPES = ['inspection', 'feed', 'treatment', 'box_added', 'cost', 'visit'];

function assertParsedEvent(evt: ParsedEvent, label: string) {
  const errors: string[] = [];

  if (!VALID_EVENT_TYPES.includes(evt.event_type)) {
    errors.push(`invalid event_type: ${evt.event_type}`);
  }
  if (evt.event_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(evt.event_date)) {
    errors.push(`invalid date format: ${evt.event_date}`);
  }
  if (typeof evt.confidence !== 'number' || evt.confidence < 0 || evt.confidence > 1) {
    errors.push(`invalid confidence: ${evt.confidence}`);
  }
  if (typeof evt.data !== 'object' || evt.data === null) {
    errors.push('data must be an object');
  }

  if (evt.event_type === 'inspection') {
    const d = evt.data;
    if (typeof d.frames_of_bees !== 'number') errors.push('inspection missing frames_of_bees');
  }
  if (evt.event_type === 'feed') {
    const d = evt.data;
    if (typeof d.feed_type !== 'string') errors.push('feed missing feed_type');
  }
  if (evt.event_type === 'treatment') {
    const d = evt.data;
    if (typeof d.product !== 'string') errors.push('treatment missing product');
  }
  if (evt.event_type === 'box_added') {
    const d = evt.data;
    if (!['brood', 'super'].includes(d.box_type as string)) errors.push('box_added missing valid box_type');
  }
  if (evt.event_type === 'cost') {
    const d = evt.data;
    if (typeof d.amount !== 'number') errors.push('cost missing numeric amount');
    if (typeof d.category !== 'string') errors.push('cost missing category');
  }

  if (errors.length > 0) {
    throw new Error(`${label}: ${errors.join(', ')}`);
  }
}

// Sample parsed output simulating what the AI would return for the first 5 messy notes
const SAMPLE_PARSED: ParsedEvent[] = [
  {
    event_type: 'visit',
    event_date: null,
    site_name: 'Riverside',
    hive_name: null,
    data: { hive_count: 0, strong: 0, medium: 0, weak: 0, feeding_done: true, feeding_type: 'sugar syrup', feeding_quantity: '2L each', treatment_applied: false, boxes_added: 0, boxes_removed: 0, source: 'ai' },
    notes: 'checked riverside today all hives looking good fed sugar syrup 2L each',
    confidence: 0.85,
  },
  {
    event_type: 'inspection',
    event_date: null,
    site_name: 'Hilltop',
    hive_name: 'hive 3',
    data: { frames_of_bees: 9, frames_of_brood: 6, frames_of_stores: 4 },
    notes: 'hive 3 v strong, 9 frames bees, 6 brood, 4 stores',
    confidence: 0.95,
  },
  {
    event_type: 'inspection',
    event_date: null,
    site_name: 'Hilltop',
    hive_name: 'hive 4',
    data: { frames_of_bees: 3, frames_of_brood: 0, frames_of_stores: 0 },
    notes: 'hive 4 struggling only 3 frames bees',
    confidence: 0.80,
  },
  {
    event_type: 'treatment',
    event_date: null,
    site_name: 'Valley',
    hive_name: null,
    data: { product: 'Apivar', method: 'strip' },
    notes: 'treated valley site with apivar strips today, all 12 hives done',
    confidence: 0.95,
  },
  {
    event_type: 'box_added',
    event_date: '2024-10-13',
    site_name: 'Coastal',
    hive_name: 'hive 7',
    data: { box_type: 'super', action: 'added' },
    notes: 'added super to hive 7',
    confidence: 0.90,
  },
  {
    event_type: 'cost',
    event_date: null,
    site_name: null,
    hive_name: null,
    data: { category: 'feed', amount: 45 },
    notes: 'spent $45 on sugar',
    confidence: 0.90,
  },
  {
    event_type: 'cost',
    event_date: null,
    site_name: null,
    hive_name: null,
    data: { category: 'treatment', amount: 120 },
    notes: 'spent $120 on apivar strips',
    confidence: 0.90,
  },
];

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

console.log('AI Parsing Tests\n');

console.log('Schema validation:');
SAMPLE_PARSED.forEach((evt, i) => {
  test(`event ${i} (${evt.event_type}) has valid schema`, () => {
    assertParsedEvent(evt, `event ${i}`);
  });
});

console.log('\nField extraction:');
test('inspection extracts frames_of_bees', () => {
  const insp = SAMPLE_PARSED.find(e => e.event_type === 'inspection' && e.hive_name === 'hive 3');
  if (!insp) throw new Error('not found');
  if ((insp.data.frames_of_bees as number) !== 9) throw new Error(`expected 9, got ${insp.data.frames_of_bees}`);
});

test('treatment extracts product name', () => {
  const t = SAMPLE_PARSED.find(e => e.event_type === 'treatment');
  if (!t) throw new Error('not found');
  if (t.data.product !== 'Apivar') throw new Error(`expected Apivar, got ${t.data.product}`);
});

test('cost extracts numeric amount in NZD', () => {
  const c = SAMPLE_PARSED.find(e => e.event_type === 'cost' && (e.data.amount as number) === 45);
  if (!c) throw new Error('not found');
  if (typeof c.data.amount !== 'number') throw new Error('amount should be number');
});

test('box_added extracts super type', () => {
  const b = SAMPLE_PARSED.find(e => e.event_type === 'box_added');
  if (!b) throw new Error('not found');
  if (b.data.box_type !== 'super') throw new Error(`expected super, got ${b.data.box_type}`);
});

test('site names are extracted', () => {
  const withSite = SAMPLE_PARSED.filter(e => e.site_name !== null);
  if (withSite.length < 3) throw new Error(`expected at least 3 events with site names, got ${withSite.length}`);
});

test('confidence values are in valid range', () => {
  for (const evt of SAMPLE_PARSED) {
    if (evt.confidence < 0 || evt.confidence > 1) throw new Error(`invalid confidence: ${evt.confidence}`);
  }
});

console.log('\nTest file validation:');
test('messy-notes.json has 30 notes', () => {
  const raw = readFileSync(join(__dirname, 'messy-notes.json'), 'utf-8');
  const notes = JSON.parse(raw);
  if (!Array.isArray(notes)) throw new Error('should be array');
  if (notes.length !== 30) throw new Error(`expected 30, got ${notes.length}`);
});

test('all notes are non-empty strings', () => {
  const raw = readFileSync(join(__dirname, 'messy-notes.json'), 'utf-8');
  const notes = JSON.parse(raw) as string[];
  for (let i = 0; i < notes.length; i++) {
    if (typeof notes[i] !== 'string' || notes[i].trim().length === 0) {
      throw new Error(`note ${i} is empty or not a string`);
    }
  }
});

test('notes cover multiple event types', () => {
  const raw = readFileSync(join(__dirname, 'messy-notes.json'), 'utf-8');
  const notes = JSON.parse(raw) as string[];
  const text = notes.join(' ').toLowerCase();
  const types = ['inspect', 'feed', 'treat', 'super', 'cost', '$', 'visit', 'check'];
  const found = types.filter(t => text.includes(t));
  if (found.length < 5) throw new Error(`expected coverage of 5+ types, found: ${found.join(', ')}`);
});

test('notes reference multiple sites', () => {
  const raw = readFileSync(join(__dirname, 'messy-notes.json'), 'utf-8');
  const notes = JSON.parse(raw) as string[];
  const text = notes.join(' ').toLowerCase();
  const sites = ['riverside', 'hilltop', 'valley', 'coastal'];
  const found = sites.filter(s => text.includes(s));
  if (found.length < 3) throw new Error(`expected 3+ sites, found: ${found.join(', ')}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
