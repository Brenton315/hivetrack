/**
 * Tests for marketplace quote ranking algorithm.
 * Run with: npx tsx test/quote-ranking.test.ts
 */

import { rankQuotes, simulateQuotes, DEMO_SUPPLIERS } from '../src/lib/marketplace';
import type { SupplierQuote, TenderItem } from '../src/lib/marketplace';

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

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// --- rankQuotes tests ---

console.log('Quote Ranking Tests\n');

console.log('Basic ranking:');

test('returns same number of quotes', () => {
  const quotes: SupplierQuote[] = [
    { supplier_id: 's1', supplier_name: 'A', items: [{ product_id: 'p1', unit_price: 10, available: true, lead_days: 3 }], delivery_fee: 0, total: 10, score: 0 },
    { supplier_id: 's2', supplier_name: 'B', items: [{ product_id: 'p1', unit_price: 20, available: true, lead_days: 3 }], delivery_fee: 0, total: 20, score: 0 },
  ];
  const ranked = rankQuotes(quotes);
  assert(ranked.length === 2, `expected 2, got ${ranked.length}`);
});

test('assigns scores to all quotes', () => {
  const quotes: SupplierQuote[] = [
    { supplier_id: 's1', supplier_name: 'A', items: [{ product_id: 'p1', unit_price: 10, available: true, lead_days: 3 }], delivery_fee: 0, total: 10, score: 0 },
    { supplier_id: 's2', supplier_name: 'B', items: [{ product_id: 'p1', unit_price: 20, available: true, lead_days: 5 }], delivery_fee: 0, total: 20, score: 0 },
  ];
  const ranked = rankQuotes(quotes);
  assert(ranked.every(q => q.score > 0), 'all quotes should have positive scores');
});

test('sorts by score descending', () => {
  const quotes: SupplierQuote[] = [
    { supplier_id: 's1', supplier_name: 'A', items: [{ product_id: 'p1', unit_price: 50, available: true, lead_days: 10 }], delivery_fee: 5, total: 55, score: 0 },
    { supplier_id: 's2', supplier_name: 'B', items: [{ product_id: 'p1', unit_price: 10, available: true, lead_days: 2 }], delivery_fee: 0, total: 10, score: 0 },
  ];
  const ranked = rankQuotes(quotes);
  assert(ranked[0].score >= ranked[1].score, 'first quote should have highest score');
});

console.log('\nPrice weighting (40%):');

test('cheaper supplier scores higher when other factors equal', () => {
  const quotes: SupplierQuote[] = [
    { supplier_id: 's1', supplier_name: 'Cheap', items: [{ product_id: 'p1', unit_price: 10, available: true, lead_days: 3 }], delivery_fee: 0, total: 10, score: 0 },
    { supplier_id: 's2', supplier_name: 'Expensive', items: [{ product_id: 'p1', unit_price: 50, available: true, lead_days: 3 }], delivery_fee: 0, total: 50, score: 0 },
  ];
  const ranked = rankQuotes(quotes);
  assert(ranked[0].supplier_name === 'Cheap', `expected Cheap first, got ${ranked[0].supplier_name}`);
});

console.log('\nAvailability weighting (35%):');

test('supplier with all items available scores higher at same total', () => {
  const quotes: SupplierQuote[] = [
    { supplier_id: 's1', supplier_name: 'Full', items: [
      { product_id: 'p1', unit_price: 12, available: true, lead_days: 3 },
      { product_id: 'p2', unit_price: 12, available: true, lead_days: 3 },
    ], delivery_fee: 0, total: 24, score: 0 },
    { supplier_id: 's2', supplier_name: 'Partial', items: [
      { product_id: 'p1', unit_price: 12, available: true, lead_days: 3 },
      { product_id: 'p2', unit_price: 12, available: false, lead_days: 3 },
    ], delivery_fee: 12, total: 24, score: 0 },
  ];
  const ranked = rankQuotes(quotes);
  assert(ranked[0].supplier_name === 'Full', `expected Full first, got ${ranked[0].supplier_name}`);
});

test('no items available gets 0 availability score', () => {
  const quotes: SupplierQuote[] = [
    { supplier_id: 's1', supplier_name: 'None', items: [
      { product_id: 'p1', unit_price: 5, available: false, lead_days: 3 },
    ], delivery_fee: 0, total: 5, score: 0 },
    { supplier_id: 's2', supplier_name: 'All', items: [
      { product_id: 'p1', unit_price: 20, available: true, lead_days: 3 },
    ], delivery_fee: 0, total: 20, score: 0 },
  ];
  const ranked = rankQuotes(quotes);
  assert(ranked[0].supplier_name === 'All', `expected All first, got ${ranked[0].supplier_name}`);
});

console.log('\nSpeed weighting (25%):');

test('faster supplier scores higher when other factors similar', () => {
  const quotes: SupplierQuote[] = [
    { supplier_id: 's1', supplier_name: 'Fast', items: [{ product_id: 'p1', unit_price: 20, available: true, lead_days: 1 }], delivery_fee: 0, total: 20, score: 0 },
    { supplier_id: 's2', supplier_name: 'Slow', items: [{ product_id: 'p1', unit_price: 20, available: true, lead_days: 14 }], delivery_fee: 0, total: 20, score: 0 },
  ];
  const ranked = rankQuotes(quotes);
  assert(ranked[0].supplier_name === 'Fast', `expected Fast first, got ${ranked[0].supplier_name}`);
});

console.log('\nEdge cases:');

test('handles empty items array', () => {
  const quotes: SupplierQuote[] = [
    { supplier_id: 's1', supplier_name: 'Empty', items: [], delivery_fee: 0, total: 0, score: 0 },
  ];
  const ranked = rankQuotes(quotes);
  assert(ranked.length === 1, 'should handle empty items');
  assert(typeof ranked[0].score === 'number', 'score should be a number');
});

test('handles single quote', () => {
  const quotes: SupplierQuote[] = [
    { supplier_id: 's1', supplier_name: 'Solo', items: [{ product_id: 'p1', unit_price: 25, available: true, lead_days: 3 }], delivery_fee: 5, total: 30, score: 0 },
  ];
  const ranked = rankQuotes(quotes);
  assert(ranked.length === 1, 'should return single quote');
  assert(ranked[0].score >= 0, 'score should be non-negative');
});

test('handles identical quotes', () => {
  const quotes: SupplierQuote[] = [
    { supplier_id: 's1', supplier_name: 'A', items: [{ product_id: 'p1', unit_price: 10, available: true, lead_days: 3 }], delivery_fee: 0, total: 10, score: 0 },
    { supplier_id: 's2', supplier_name: 'B', items: [{ product_id: 'p1', unit_price: 10, available: true, lead_days: 3 }], delivery_fee: 0, total: 10, score: 0 },
  ];
  const ranked = rankQuotes(quotes);
  assert(ranked[0].score === ranked[1].score, 'identical quotes should have same score');
});

test('scores are between 0 and 100', () => {
  const quotes: SupplierQuote[] = [
    { supplier_id: 's1', supplier_name: 'A', items: [{ product_id: 'p1', unit_price: 5, available: true, lead_days: 1 }], delivery_fee: 0, total: 5, score: 0 },
    { supplier_id: 's2', supplier_name: 'B', items: [{ product_id: 'p1', unit_price: 50, available: false, lead_days: 14 }], delivery_fee: 10, total: 60, score: 0 },
  ];
  const ranked = rankQuotes(quotes);
  assert(ranked.every(q => q.score >= 0 && q.score <= 100), `scores out of range: ${ranked.map(q => q.score)}`);
});

// --- simulateQuotes tests ---

console.log('\nSimulate quotes:');

test('generates one quote per demo supplier', () => {
  const items: TenderItem[] = [{ product_id: 'boxes-fd', product_name: 'Full-depth box', qty: 5 }];
  const prices = new Map([['boxes-fd', 45]]);
  const quotes = simulateQuotes(items, prices);
  assert(quotes.length === DEMO_SUPPLIERS.length, `expected ${DEMO_SUPPLIERS.length} quotes, got ${quotes.length}`);
});

test('each quote has items matching the tender', () => {
  const items: TenderItem[] = [
    { product_id: 'boxes-fd', product_name: 'Full-depth box', qty: 5 },
    { product_id: 'frames-fd', product_name: 'Full-depth frames', qty: 50 },
  ];
  const prices = new Map([['boxes-fd', 45], ['frames-fd', 3.5]]);
  const quotes = simulateQuotes(items, prices);
  quotes.forEach(q => {
    assert(q.items.length === 2, `expected 2 items, got ${q.items.length}`);
  });
});

test('quote totals are non-negative', () => {
  const items: TenderItem[] = [{ product_id: 'boxes-fd', product_name: 'Full-depth box', qty: 2 }];
  const prices = new Map([['boxes-fd', 45]]);
  const quotes = simulateQuotes(items, prices);
  quotes.forEach(q => {
    assert(q.total >= 0, `negative total: ${q.total}`);
  });
});

test('supplier names match demo data', () => {
  const items: TenderItem[] = [{ product_id: 'boxes-fd', product_name: 'Full-depth box', qty: 1 }];
  const prices = new Map([['boxes-fd', 45]]);
  const quotes = simulateQuotes(items, prices);
  const names = new Set(quotes.map(q => q.supplier_name));
  DEMO_SUPPLIERS.forEach(s => {
    assert(names.has(s.name), `missing supplier: ${s.name}`);
  });
});

test('lead days are positive integers', () => {
  const items: TenderItem[] = [{ product_id: 'boxes-fd', product_name: 'Full-depth box', qty: 3 }];
  const prices = new Map([['boxes-fd', 45]]);
  const quotes = simulateQuotes(items, prices);
  quotes.forEach(q => {
    q.items.forEach(qi => {
      assert(qi.lead_days > 0, `lead_days should be positive: ${qi.lead_days}`);
      assert(Number.isInteger(qi.lead_days), `lead_days should be integer: ${qi.lead_days}`);
    });
  });
});

// --- Integration: simulateQuotes → rankQuotes ---

console.log('\nIntegration:');

test('rankQuotes works on simulateQuotes output', () => {
  const items: TenderItem[] = [
    { product_id: 'boxes-fd', product_name: 'Full-depth box', qty: 5 },
    { product_id: 'frames-fd', product_name: 'Full-depth frames', qty: 50 },
  ];
  const prices = new Map([['boxes-fd', 45], ['frames-fd', 3.5]]);
  const raw = simulateQuotes(items, prices);
  const ranked = rankQuotes(raw);
  assert(ranked.length === DEMO_SUPPLIERS.length, 'should rank all quotes');
  assert(ranked.every(q => q.score > 0), 'all ranked quotes should have scores');
  for (let i = 1; i < ranked.length; i++) {
    assert(ranked[i - 1].score >= ranked[i].score, 'should be sorted descending by score');
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
