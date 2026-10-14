import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { InventoryItem, InventoryCategory } from '../../lib/database.types';

interface Props {
  item?: InventoryItem | null;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES: { value: InventoryCategory; label: string }[] = [
  { value: 'feed', label: 'Feed' },
  { value: 'treatment', label: 'Treatments' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'protective_gear', label: 'Protective Gear' },
  { value: 'other', label: 'Other' },
];

export default function InventoryForm({ item, onClose, onSaved }: Props) {
  const [productName, setProductName] = useState(item?.product_name ?? '');
  const [category, setCategory] = useState<InventoryCategory>(item?.category ?? 'feed');
  const [quantity, setQuantity] = useState(String(item?.quantity ?? ''));
  const [unit, setUnit] = useState(item?.unit ?? 'units');
  const [minStock, setMinStock] = useState(String(item?.min_stock ?? '0'));
  const [supplier, setSupplier] = useState(item?.supplier ?? '');
  const [costPerUnit, setCostPerUnit] = useState(String(item?.cost_per_unit ?? ''));
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not signed in'); setSaving(false); return; }

    const row = {
      user_id: user.id,
      product_name: productName,
      category,
      quantity: Number(quantity) || 0,
      unit,
      min_stock: Number(minStock) || 0,
      supplier: supplier || null,
      cost_per_unit: Number(costPerUnit) || 0,
      notes: notes || null,
      last_restocked: item?.last_restocked ?? new Date().toISOString().slice(0, 10),
    };

    const result = item
      ? await supabase.from('inventory').update(row).eq('id', item.id)
      : await supabase.from('inventory').insert(row);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
    } else {
      onSaved();
    }
  };

  return (
    <div className="hq-overlay">
      <div className="hq-modal">
        <div className="hq-modal-head">
          <h2>{item ? 'Edit Item' : 'Add Inventory Item'}</h2>
          <button type="button" onClick={onClose} className="hq-modal-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="hq-field">
            <label className="hq-label" htmlFor="inv-name">Product name *</label>
            <input id="inv-name" value={productName} onChange={e => setProductName(e.target.value)} required className="hq-input" placeholder="e.g. Apivar Strips (10pk)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="hq-field">
              <label className="hq-label" htmlFor="inv-cat">Category *</label>
              <select id="inv-cat" value={category} onChange={e => setCategory(e.target.value as InventoryCategory)} className="hq-select">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="hq-field">
              <label className="hq-label" htmlFor="inv-supplier">Supplier</label>
              <input id="inv-supplier" value={supplier} onChange={e => setSupplier(e.target.value)} className="hq-input" placeholder="e.g. Ecrotek" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="hq-field">
              <label className="hq-label" htmlFor="inv-qty">Quantity *</label>
              <input id="inv-qty" type="number" min="0" step="0.1" value={quantity} onChange={e => setQuantity(e.target.value)} required className="hq-input" />
            </div>
            <div className="hq-field">
              <label className="hq-label" htmlFor="inv-unit">Unit</label>
              <input id="inv-unit" value={unit} onChange={e => setUnit(e.target.value)} className="hq-input" placeholder="e.g. packs, litres, kg" />
            </div>
            <div className="hq-field">
              <label className="hq-label" htmlFor="inv-min">Min stock</label>
              <input id="inv-min" type="number" min="0" step="0.1" value={minStock} onChange={e => setMinStock(e.target.value)} className="hq-input" />
            </div>
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="inv-cost">Cost per unit ($NZD)</label>
            <input id="inv-cost" type="number" min="0" step="0.01" value={costPerUnit} onChange={e => setCostPerUnit(e.target.value)} className="hq-input" />
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="inv-notes">Notes</label>
            <textarea id="inv-notes" value={notes} onChange={e => setNotes(e.target.value)} className="hq-input" rows={2} placeholder="Optional notes" />
          </div>

          {error && <p className="hq-error" style={{ marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={saving} className="hq-btn-primary" style={{ width: '100%', minHeight: 44 }}>
            {saving ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
          </button>
        </form>
      </div>
    </div>
  );
}
