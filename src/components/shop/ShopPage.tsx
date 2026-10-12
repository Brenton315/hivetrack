import { useState, useMemo } from 'react';
import { SETTINGS } from '../../lib/settings';
import Logo from '../layout/Logo';
import { fmtMoney } from '../../lib/format';

type ShopCategory = 'All' | typeof SETTINGS.shop.categories[number];

interface OrderItem {
  id: string;
  qty: number;
}

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState<ShopCategory>('All');
  const [order, setOrder] = useState<OrderItem[]>([]);

  const tabs: ShopCategory[] = ['All', ...SETTINGS.shop.categories];
  const products = SETTINGS.shop.products;

  const filtered = useMemo(
    () => activeTab === 'All' ? products : products.filter(p => p.category === activeTab),
    [activeTab, products],
  );

  const productMap = useMemo(
    () => new Map(products.map(p => [p.id, p])),
    [products],
  );

  function addItem(id: string) {
    setOrder(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id, qty: 1 }];
    });
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

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Shop</h1>
          <span className="hq-subtitle">Beekeeping supplies reference</span>
        </div>
      </header>

      {/* Category tabs */}
      <div className="hq-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`hq-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main layout: products + order */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {/* Products list */}
        <div className="hq-card" style={{ flex: '1 1 400px', paddingBottom: 8 }}>
          <div className="hq-card-head">
            <h2>Products</h2>
            <span className="hq-muted" style={{ fontSize: 13 }}>{filtered.length} items</span>
          </div>
          <div
            className="hq-trow hq-thead"
            style={{ gridTemplateColumns: 'minmax(0,1fr) 100px 80px 56px' }}
          >
            <div>Product</div>
            <div>Supplier</div>
            <div style={{ textAlign: 'right' }}>Price</div>
            <div />
          </div>
          {filtered.map(product => (
            <div
              key={product.id}
              className="hq-trow"
              style={{ gridTemplateColumns: 'minmax(0,1fr) 100px 80px 56px', cursor: 'default' }}
            >
              <div>
                <span style={{ fontWeight: 500 }}>{product.name}</span>
                <span
                  className="hq-muted"
                  style={{ display: 'block', fontSize: 12 }}
                >
                  {product.category}
                </span>
              </div>
              <div className="hq-muted" style={{ fontSize: 13 }}>{product.supplier}</div>
              <div style={{ textAlign: 'right', fontWeight: 500 }}>{fmtMoney(product.price)}</div>
              <div style={{ textAlign: 'center' }}>
                <button
                  className="hq-btn-secondary"
                  style={{ fontSize: 12, padding: '2px 10px' }}
                  onClick={() => addItem(product.id)}
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="hq-card" style={{ flex: '0 1 320px', minWidth: 260, paddingBottom: 8 }}>
          <div className="hq-card-head">
            <h2>Order list</h2>
            {order.length > 0 && (
              <button className="hq-link" onClick={() => setOrder([])}>
                Clear
              </button>
            )}
          </div>

          {order.length === 0 ? (
            <p className="hq-empty">No items added yet.</p>
          ) : (
            <>
              {order.map(item => {
                const product = productMap.get(item.id);
                if (!product) return null;
                const lineTotal = product.price * item.qty;
                return (
                  <div
                    key={item.id}
                    className="hq-trow"
                    style={{
                      gridTemplateColumns: 'minmax(0,1fr) 80px 28px',
                      cursor: 'default',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 500 }}>{product.name}</span>
                      <span
                        className="hq-muted"
                        style={{ display: 'block', fontSize: 12 }}
                      >
                        {item.qty} x {fmtMoney(product.price)}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 500 }}>
                      {fmtMoney(lineTotal)}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontSize: 16,
                          fontWeight: 700,
                          lineHeight: 1,
                          padding: '2px 4px',
                        }}
                        aria-label={`Remove ${product.name}`}
                      >
                        x
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Grand total */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px 8px',
                  borderTop: '1px solid var(--line)',
                  marginTop: 4,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>Total</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--brand)' }}>
                  {fmtMoney(grandTotal)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
