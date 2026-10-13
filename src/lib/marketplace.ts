export interface TenderItem {
  product_id: string;
  product_name: string;
  qty: number;
}

export interface SupplierQuote {
  supplier_id: string;
  supplier_name: string;
  items: Array<{
    product_id: string;
    unit_price: number;
    available: boolean;
    lead_days: number;
  }>;
  delivery_fee: number;
  total: number;
  score: number;
}

export interface Supplier {
  id: string;
  name: string;
  location: string;
  rating: number;
  delivery_days: number;
  free_delivery_over: number;
  delivery_fee: number;
}

export const DEMO_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'Ecrotek', location: 'Hamilton', rating: 4.7, delivery_days: 3, free_delivery_over: 200, delivery_fee: 15 },
  { id: 's2', name: 'Ceracell', location: 'Tauranga', rating: 4.5, delivery_days: 4, free_delivery_over: 250, delivery_fee: 18 },
  { id: 's3', name: 'BeeQuip NZ', location: 'Auckland', rating: 4.3, delivery_days: 2, free_delivery_over: 150, delivery_fee: 12 },
  { id: 's4', name: 'Farmlands Co-op', location: 'Nationwide', rating: 4.2, delivery_days: 5, free_delivery_over: 300, delivery_fee: 20 },
];

function randomVariation(base: number, range: number): number {
  return Math.round((base + (Math.random() - 0.5) * 2 * range) * 100) / 100;
}

export function simulateQuotes(
  items: TenderItem[],
  productPrices: Map<string, number>,
): SupplierQuote[] {
  return DEMO_SUPPLIERS.map(supplier => {
    const quotedItems = items.map(item => {
      const basePrice = productPrices.get(item.product_id) ?? 20;
      const variation = supplier.rating > 4.5 ? 0.08 : supplier.rating > 4.3 ? 0.12 : 0.15;
      return {
        product_id: item.product_id,
        unit_price: randomVariation(basePrice, basePrice * variation),
        available: Math.random() > 0.1,
        lead_days: supplier.delivery_days + Math.floor(Math.random() * 3),
      };
    });

    const subtotal = quotedItems.reduce((sum, qi, i) => {
      return sum + (qi.available ? qi.unit_price * items[i].qty : 0);
    }, 0);

    const delivery = subtotal >= supplier.free_delivery_over ? 0 : supplier.delivery_fee;
    const total = subtotal + delivery;

    return {
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      items: quotedItems,
      delivery_fee: delivery,
      total,
      score: 0,
    };
  });
}

export function rankQuotes(quotes: SupplierQuote[]): SupplierQuote[] {
  const maxTotal = Math.max(...quotes.map(q => q.total), 1);
  const maxLead = Math.max(...quotes.flatMap(q => q.items.map(i => i.lead_days)), 1);

  const scored = quotes.map(q => {
    const availability = q.items.filter(i => i.available).length / Math.max(q.items.length, 1);
    const priceScore = 1 - (q.total / maxTotal);
    const avgLead = q.items.reduce((s, i) => s + i.lead_days, 0) / Math.max(q.items.length, 1);
    const speedScore = 1 - (avgLead / maxLead);

    const score = Math.round(
      (priceScore * 40 + availability * 35 + speedScore * 25) * 100
    ) / 100;

    return { ...q, score };
  });

  return scored.sort((a, b) => b.score - a.score);
}
