import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import type { InventoryItem, InventoryCategory } from '../../lib/database.types';
import { fmtMoney } from '../../lib/format';
import Logo from '../layout/Logo';
import InventoryForm from './InventoryForm';
import UseStockDialog from './UseStockDialog';

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  feed: 'Feed',
  treatment: 'Treatments',
  equipment: 'Equipment',
  protective_gear: 'Protective Gear',
  other: 'Other',
};

const CATEGORY_ORDER: InventoryCategory[] = ['feed', 'treatment', 'equipment', 'protective_gear', 'other'];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [usingItem, setUsingItem] = useState<InventoryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<InventoryCategory | 'all'>('all');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .order('category')
      .order('product_name');
    setItems((data ?? []) as InventoryItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = useMemo(() => {
    if (filterCategory === 'all') return items;
    return items.filter(i => i.category === filterCategory);
  }, [items, filterCategory]);

  const grouped = useMemo(() => {
    const groups = new Map<InventoryCategory, InventoryItem[]>();
    for (const item of filtered) {
      const cat = item.category as InventoryCategory;
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(item);
    }
    return groups;
  }, [filtered]);

  const lowStockItems = useMemo(() =>
    items.filter(i => i.min_stock > 0 && i.quantity <= i.min_stock),
    [items],
  );

  const totalValue = useMemo(() =>
    items.reduce((sum, i) => sum + (i.quantity * i.cost_per_unit), 0),
    [items],
  );

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Inventory</h1>
          <span className="hq-subtitle">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="hq-actions">
          <button type="button" className="hq-btn-primary hq-add-btn" onClick={() => { setEditingItem(null); setShowForm(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            <span className="hq-add-label">Add item</span>
          </button>
        </div>
      </header>

      {/* Summary strip */}
      <div className="hq-card hq-kpis">
        <div className="hq-kpi">
          <span className="hq-kpi-label">Total items</span>
          <span className="hq-kpi-value">{items.length}</span>
        </div>
        <div className="hq-kpi">
          <span className="hq-kpi-label">Stock value</span>
          <span className="hq-kpi-value">{fmtMoney(totalValue)}</span>
        </div>
        <div className="hq-kpi">
          <span className="hq-kpi-label">Low stock</span>
          <span className="hq-kpi-value" style={{ color: lowStockItems.length > 0 ? 'var(--weak-text)' : undefined }}>
            {lowStockItems.length}
          </span>
        </div>
        <div className="hq-kpi">
          <span className="hq-kpi-label">Categories</span>
          <span className="hq-kpi-value">{new Set(items.map(i => i.category)).size}</span>
        </div>
      </div>

      {/* Low stock alerts */}
      {lowStockItems.length > 0 && (
        <div className="hq-card" style={{ padding: 14, borderLeft: '3px solid var(--weak-text)', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--weak-text)' }}>
            Low stock alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {lowStockItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{item.product_name}</span>
                <span style={{ color: 'var(--weak-text)', fontWeight: 500 }}>
                  {item.quantity} {item.unit} (min: {item.min_stock})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
        <button
          className={filterCategory === 'all' ? 'hq-btn-primary hq-btn-sm' : 'hq-btn-secondary hq-btn-sm'}
          onClick={() => setFilterCategory('all')}
        >
          All
        </button>
        {CATEGORY_ORDER.map(cat => {
          const count = items.filter(i => i.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              className={filterCategory === cat ? 'hq-btn-primary hq-btn-sm' : 'hq-btn-secondary hq-btn-sm'}
              onClick={() => setFilterCategory(cat)}
            >
              {CATEGORY_LABELS[cat]} ({count})
            </button>
          );
        })}
      </div>

      {/* Inventory table */}
      {loading ? (
        <p className="hq-empty">Loading...</p>
      ) : items.length === 0 ? (
        <div className="hq-card">
          <p className="hq-empty">
            No inventory items yet.{' '}
            <button className="hq-link" onClick={() => setShowForm(true)}>Add your first item</button>
          </p>
        </div>
      ) : (
        CATEGORY_ORDER.map(cat => {
          const catItems = grouped.get(cat);
          if (!catItems) return null;
          return (
            <div key={cat} className="hq-card" style={{ paddingBottom: 8, marginBottom: 12 }}>
              <div className="hq-card-head">
                <h2>{CATEGORY_LABELS[cat]}</h2>
              </div>
              <div className="hq-trow hq-thead" style={{ gridTemplateColumns: 'minmax(0,1.5fr) 80px 60px 80px 80px 60px' }}>
                <div>Product</div>
                <div style={{ textAlign: 'right' }}>Qty</div>
                <div>Unit</div>
                <div>Supplier</div>
                <div style={{ textAlign: 'right' }}>$/unit</div>
                <div></div>
              </div>
              {catItems.map(item => {
                const isLow = item.min_stock > 0 && item.quantity <= item.min_stock;
                return (
                  <div
                    key={item.id}
                    className="hq-trow"
                    style={{ gridTemplateColumns: 'minmax(0,1.5fr) 80px 60px 80px 80px 60px', cursor: 'default' }}
                  >
                    <div>
                      <span style={{ fontWeight: 500 }}>{item.product_name}</span>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 500, color: isLow ? 'var(--weak-text)' : undefined }}>
                      {item.quantity}
                      {isLow && <span style={{ fontSize: 11 }}> !</span>}
                    </div>
                    <div className="hq-muted">{item.unit}</div>
                    <div className="hq-muted" style={{ fontSize: 12 }}>{item.supplier ?? '--'}</div>
                    <div style={{ textAlign: 'right' }} className="hq-muted">{fmtMoney(item.cost_per_unit)}</div>
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <button
                        className="hq-icon-btn"
                        title="Use stock"
                        onClick={() => setUsingItem(item)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button
                        className="hq-icon-btn"
                        title="Edit"
                        onClick={() => { setEditingItem(item); setShowForm(true); }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}

      {showForm && (
        <InventoryForm
          item={editingItem}
          onClose={() => { setShowForm(false); setEditingItem(null); }}
          onSaved={() => { setShowForm(false); setEditingItem(null); fetchItems(); }}
        />
      )}

      {usingItem && (
        <UseStockDialog
          item={usingItem}
          onClose={() => setUsingItem(null)}
          onUsed={() => { setUsingItem(null); fetchItems(); }}
        />
      )}
    </>
  );
}
