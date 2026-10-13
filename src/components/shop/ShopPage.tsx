import { useState, useMemo } from 'react';
import { SETTINGS } from '../../lib/settings';
import { simulateQuotes, rankQuotes } from '../../lib/marketplace';
import type { TenderItem, SupplierQuote } from '../../lib/marketplace';
import Logo from '../layout/Logo';
import { fmtMoney } from '../../lib/format';

type ShopCategory = 'All' | typeof SETTINGS.shop.categories[number];
type Tab = 'order' | 'quotes';

interface OrderItem {
  id: string;
  qty: number;
}

export default function ShopPage() {
  const [tab, setTab] = useState<Tab>('order');
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('All');
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [quotes, setQuotes] = useState<SupplierQuote[] | null>(null);
  const [loading, setLoading] = useState(false);

  const categories: ShopCategory[] = ['All', ...SETTINGS.shop.categories];
  const products = SETTINGS.shop.products;

  const filtered = useMemo(
    () => activeCategory === 'All' ? products : products.filter(p => p.category === activeCategory),
    [activeCategory, products],
  );

  const productMap = useMemo(
    () => new Map(products.map(p => [p.id as string, p])),
    [products],
  );

  function addItem(id: string) {
    setOrder(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) return prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { id, qty: 1 }];
    });
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { setOrder(prev => prev.filter(item => item.id !== id)); return; }
    setOrder(prev => prev.map(item => item.id === id ? { ...item, qty } : item));
  }

  function removeItem(id: string) {
    setOrder(prev => prev.filter(item => item.id !== id));
  }

  const grandTotal = useMemo(
    () => order.reduce((sum, item) => {
      const product = productMap.get(item.id);
      return sum + (product ? product.price * item.qty : 0);
    }, 0),
    [order, productMap],
  );

  function handleRequestQuotes() {
    if (order.length === 0) return;
    setLoading(true);

    const tenderItems: TenderItem[] = order.map(o => ({
      product_id: o.id,
      product_name: productMap.get(o.id)?.name ?? '',
      qty: o.qty,
    }));

    const priceMap = new Map(products.map(p => [p.id, p.price]));

    setTimeout(() => {
      const raw = simulateQuotes(tenderItems, priceMap);
      const ranked = rankQuotes(raw);
      setQuotes(ranked);
      setTab('quotes');
      setLoading(false);
    }, 800);
  }

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Marketplace</h1>
          <span className="hq-subtitle">Build an order, get supplier quotes</span>
        </div>
      </header>

      <div className="hq-tabs" role="tablist" style={{ marginBottom: 16 }}>
        <button role="tab" className={`hq-tab ${tab === 'order' ? 'active' : ''}`} onClick={() => setTab('order')}>
          Order builder
        </button>
        <button role="tab" className={`hq-tab ${tab === 'quotes' ? 'active' : ''}`} onClick={() => setTab('quotes')} disabled={!quotes}>
          Quotes {quotes ? `(${quotes.length})` : ''}
        </button>
      </div>

      {tab === 'order' && (
        <>
          <div className="hq-tabs" style={{ marginBottom: 12 }}>
            {categories.map(cat => (
              <button key={cat} className={`hq-tab ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="hq-card" style={{ flex: '1 1 400px', paddingBottom: 8 }}>
              <div className="hq-card-head">
                <h2>Products</h2>
                <span className="hq-muted" style={{ fontSize: 13 }}>{filtered.length} items</span>
              </div>
              <div className="hq-trow hq-thead" style={{ gridTemplateColumns: 'minmax(0,1fr) 80px 56px' }}>
                <div>Product</div>
                <div style={{ textAlign: 'right' }}>Est. price</div>
                <div />
              </div>
              {filtered.map(product => (
                <div key={product.id} className="hq-trow" style={{ gridTemplateColumns: 'minmax(0,1fr) 80px 56px', cursor: 'default' }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{product.name}</span>
                    <span className="hq-muted" style={{ display: 'block', fontSize: 12 }}>{product.category}</span>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 500 }}>{fmtMoney(product.price)}</div>
                  <div style={{ textAlign: 'center' }}>
                    <button className="hq-btn-secondary" style={{ fontSize: 12, padding: '2px 10px' }} onClick={() => addItem(product.id)}>
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hq-card" style={{ flex: '0 1 320px', minWidth: 260, paddingBottom: 8 }}>
              <div className="hq-card-head">
                <h2>Your order</h2>
                {order.length > 0 && <button className="hq-link" onClick={() => setOrder([])}>Clear</button>}
              </div>

              {order.length === 0 ? (
                <p className="hq-empty">Add products to build your order, then request supplier quotes.</p>
              ) : (
                <>
                  {order.map(item => {
                    const product = productMap.get(item.id);
                    if (!product) return null;
                    return (
                      <div key={item.id} className="hq-trow" style={{ gridTemplateColumns: 'minmax(0,1fr) 70px 80px 28px', cursor: 'default' }}>
                        <div>
                          <span style={{ fontWeight: 500, fontSize: 13 }}>{product.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>-</button>
                          <span style={{ fontSize: 13, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>+</button>
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 500, fontSize: 13 }}>{fmtMoney(product.price * item.qty)}</div>
                        <div style={{ textAlign: 'center' }}>
                          <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16, fontWeight: 700 }} aria-label={`Remove ${product.name}`}>x</button>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px 8px', borderTop: '1px solid var(--line)', marginTop: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Estimated total</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--brand)' }}>{fmtMoney(grandTotal)}</span>
                  </div>
                  <div style={{ padding: '0 16px 8px' }}>
                    <button className="hq-btn-primary" onClick={handleRequestQuotes} disabled={loading} style={{ width: '100%' }}>
                      {loading ? 'Getting quotes...' : 'Request supplier quotes'}
                    </button>
                    <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 6 }}>
                      Demo mode — simulated quotes from seeded suppliers
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'quotes' && quotes && (
        <div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            Quotes ranked by price (40%), availability (35%), and delivery speed (25%). These are simulated demo quotes.
          </p>

          {quotes.map((q, rank) => (
            <div key={q.supplier_id} className="hq-card" style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11,
                    fontWeight: 600, marginRight: 8,
                    background: rank === 0 ? 'var(--strong)' : 'var(--muted)', color: '#fff',
                  }}>
                    #{rank + 1}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{q.supplier_name}</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand)' }}>{fmtMoney(q.total)}</span>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                <span>Score: {q.score.toFixed(1)}</span>
                <span>Delivery: {q.delivery_fee > 0 ? fmtMoney(q.delivery_fee) : 'Free'}</span>
                <span>{q.items.filter(i => i.available).length}/{q.items.length} items available</span>
              </div>

              <div style={{ fontSize: 12 }}>
                {q.items.map((qi, i) => {
                  const product = productMap.get(qi.product_id);
                  const orderItem = order.find(o => o.id === qi.product_id);
                  return (
                    <div key={qi.product_id} style={{
                      display: 'flex', justifyContent: 'space-between', padding: '4px 0',
                      borderBottom: i < q.items.length - 1 ? '1px solid var(--line)' : 'none',
                      opacity: qi.available ? 1 : 0.5,
                    }}>
                      <span>
                        {product?.name ?? qi.product_id}
                        {!qi.available && <span style={{ color: 'var(--weak-text)', marginLeft: 6 }}>(unavailable)</span>}
                      </span>
                      <span>
                        {qi.available ? `${orderItem?.qty ?? 1} x ${fmtMoney(qi.unit_price)} = ${fmtMoney(qi.unit_price * (orderItem?.qty ?? 1))}` : '—'}
                        <span style={{ color: 'var(--muted)', marginLeft: 8 }}>{qi.lead_days}d</span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 10 }}>
                <button className="hq-btn-secondary" style={{ width: '100%', fontSize: 13 }} disabled>
                  Accept quote (coming soon)
                </button>
                <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 4 }}>
                  No real orders or emails will be sent without your confirmation
                </p>
              </div>
            </div>
          ))}

          <button className="hq-btn-secondary" onClick={() => setTab('order')} style={{ width: '100%' }}>
            Back to order builder
          </button>
        </div>
      )}
    </>
  );
}
