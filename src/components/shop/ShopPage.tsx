import { useState, useMemo } from 'react';
import { SETTINGS } from '../../lib/settings';
import { fmtMoney } from '../../lib/format';
import Logo from '../layout/Logo';

type ShopCategory = (typeof SETTINGS.shop.categories)[number] | 'All';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  supplier: string;
}

export default function ShopPage() {
  const [filter, setFilter] = useState<ShopCategory>('All');
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [showCart, setShowCart] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const products = SETTINGS.shop.products;

  const filtered = useMemo(() => {
    if (filter === 'All') return products;
    return products.filter(p => p.category === filter);
  }, [filter, products]);

  const cartItems = useMemo(() => Array.from(cart.values()), [cart]);
  const cartTotal = useMemo(() => cartItems.reduce((s, i) => s + i.price * i.qty, 0), [cartItems]);
  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + i.qty, 0), [cartItems]);

  const addToCart = (p: typeof products[number]) => {
    setCart(prev => {
      const next = new Map(prev);
      const existing = next.get(p.id);
      if (existing) {
        next.set(p.id, { ...existing, qty: existing.qty + 1 });
      } else {
        next.set(p.id, { id: p.id, name: p.name, price: p.price, qty: 1, supplier: p.supplier });
      }
      return next;
    });
  };

  const updateQty = (id: string, qty: number) => {
    setCart(prev => {
      const next = new Map(prev);
      if (qty <= 0) {
        next.delete(id);
      } else {
        const item = next.get(id);
        if (item) next.set(id, { ...item, qty });
      }
      return next;
    });
  };

  const placeOrder = () => {
    setOrderPlaced(true);
    setCart(new Map());
  };

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Marketplace</h1>
          <span className="hq-subtitle">{products.length} products</span>
        </div>
        <div className="hq-actions">
          <button
            type="button"
            className="hq-btn-primary hq-add-btn"
            onClick={() => setShowCart(!showCart)}
            style={{ position: 'relative' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="hq-add-label">Cart{cartCount > 0 ? ` (${cartCount})` : ''}</span>
          </button>
        </div>
      </header>

      {orderPlaced && (
        <div className="hq-card" style={{ padding: 16, borderLeft: '3px solid var(--brand)', marginBottom: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--brand)' }}>
            Order simulation complete. In production, this would send a quote request to the supplier(s).
          </p>
          <button className="hq-link" onClick={() => setOrderPlaced(false)} style={{ marginTop: 4 }}>Dismiss</button>
        </div>
      )}

      {/* Cart panel */}
      {showCart && (
        <div className="hq-card" style={{ marginBottom: 12, padding: 16 }}>
          <div className="hq-card-head" style={{ padding: '0 0 10px' }}>
            <h2>Shopping Cart</h2>
            <button className="hq-link" onClick={() => setShowCart(false)}>Close</button>
          </div>
          {cartItems.length === 0 ? (
            <p className="hq-empty">Your cart is empty</p>
          ) : (
            <>
              {cartItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                    <div className="hq-muted" style={{ fontSize: 12 }}>{item.supplier} — {fmtMoney(item.price)} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button className="hq-btn-secondary hq-btn-xs" onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
                    <span style={{ fontSize: 14, fontWeight: 500, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button className="hq-btn-secondary hq-btn-xs" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                    <span style={{ fontSize: 14, fontWeight: 600, minWidth: 60, textAlign: 'right' }}>{fmtMoney(item.price * item.qty)}</span>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Total: {fmtMoney(cartTotal)}</span>
                <button className="hq-btn-primary" onClick={placeOrder} style={{ minHeight: 40 }}>
                  Request Quote
                </button>
              </div>
              <p className="hq-muted" style={{ fontSize: 11, marginTop: 6 }}>
                Demo mode — no real orders will be placed or emails sent.
              </p>
            </>
          )}
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
        {(['All', ...SETTINGS.shop.categories] as ShopCategory[]).map(cat => (
          <button
            key={cat}
            className={filter === cat ? 'hq-btn-primary hq-btn-sm' : 'hq-btn-secondary hq-btn-sm'}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="hq-shop-grid">
        {filtered.map(p => {
          const inCart = cart.get(p.id);
          return (
            <div key={p.id} className="hq-card hq-shop-item">
              <div className="hq-shop-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  {p.category === 'Feed' && <><path d="M12 2a10 10 0 0 0-6.88 17.23l.9-3.23A7 7 0 0 1 12 4" /><circle cx="12" cy="12" r="3" /></>}
                  {p.category === 'Treatments' && <><path d="M8 2h8l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6l4-4z" /><path d="M12 10v6M9 13h6" /></>}
                  {p.category === 'Equipment' && <><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 6V4h12v2" /></>}
                  {p.category === 'Protective gear' && <><circle cx="12" cy="8" r="5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>}
                </svg>
              </div>
              <div className="hq-shop-info">
                <span className="hq-shop-name">{p.name}</span>
                <span className="hq-shop-supplier">{p.supplier}</span>
                <span className="hq-shop-cat">{p.category}</span>
              </div>
              <div className="hq-shop-footer">
                <span className="hq-shop-price">{fmtMoney(p.price)}</span>
                {inCart ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button className="hq-btn-secondary hq-btn-xs" onClick={() => updateQty(p.id, inCart.qty - 1)}>-</button>
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 18, textAlign: 'center' }}>{inCart.qty}</span>
                    <button className="hq-btn-secondary hq-btn-xs" onClick={() => updateQty(p.id, inCart.qty + 1)}>+</button>
                  </div>
                ) : (
                  <button className="hq-btn-primary hq-btn-sm" onClick={() => addToCart(p)}>Add</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
