import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSites } from '../../lib/hooks';
import type { InventoryItem } from '../../lib/database.types';

interface Props {
  item: InventoryItem;
  onClose: () => void;
  onUsed: () => void;
}

export default function UseStockDialog({ item, onClose, onUsed }: Props) {
  const { sites } = useSites();
  const [quantity, setQuantity] = useState('1');
  const [siteId, setSiteId] = useState('');
  const [usedDate, setUsedDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleUse = async () => {
    const qty = Number(quantity);
    if (!qty || qty <= 0) { setError('Enter a valid quantity'); return; }
    if (qty > item.quantity) { setError(`Only ${item.quantity} ${item.unit} in stock`); return; }

    setSaving(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not signed in'); setSaving(false); return; }

    // Record usage
    const { error: usageErr } = await supabase.from('inventory_usage').insert({
      user_id: user.id,
      inventory_id: item.id,
      quantity_used: qty,
      used_date: usedDate,
      site_id: siteId || null,
      notes: notes || null,
    });

    if (usageErr) {
      setError(usageErr.message);
      setSaving(false);
      return;
    }

    // Deduct from inventory
    const { error: updateErr } = await supabase
      .from('inventory')
      .update({ quantity: item.quantity - qty })
      .eq('id', item.id);

    if (updateErr) {
      setError(updateErr.message);
      setSaving(false);
      return;
    }

    onUsed();
  };

  return (
    <div className="hq-overlay">
      <div className="hq-modal">
        <div className="hq-modal-head">
          <h2>Use Stock</h2>
          <button type="button" onClick={onClose} className="hq-modal-close">&times;</button>
        </div>

        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
          <strong>{item.product_name}</strong> — {item.quantity} {item.unit} in stock
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="hq-field">
            <label className="hq-label" htmlFor="use-qty">Quantity to use *</label>
            <input
              id="use-qty"
              type="number"
              min="0.1"
              max={item.quantity}
              step="0.1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="hq-input"
            />
          </div>
          <div className="hq-field">
            <label className="hq-label" htmlFor="use-date">Date</label>
            <input id="use-date" type="date" value={usedDate} onChange={e => setUsedDate(e.target.value)} className="hq-input" />
          </div>
        </div>

        <div className="hq-field">
          <label className="hq-label" htmlFor="use-site">Used at site</label>
          <select id="use-site" value={siteId} onChange={e => setSiteId(e.target.value)} className="hq-select">
            <option value="">Not specified</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="hq-field">
          <label className="hq-label" htmlFor="use-notes">Notes</label>
          <input id="use-notes" value={notes} onChange={e => setNotes(e.target.value)} className="hq-input" placeholder="Optional" />
        </div>

        {error && <p className="hq-error" style={{ marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onClose} className="hq-btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button type="button" onClick={handleUse} disabled={saving} className="hq-btn-primary" style={{ flex: 1, minHeight: 44 }}>
            {saving ? 'Recording...' : 'Use Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
