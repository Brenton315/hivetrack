import { useState } from 'react';
import { useOverviewData } from '../../lib/hooks';

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

export default function AdrForm() {
  const overview = useOverviewData();
  const currentYear = new Date().getFullYear();
  const season = `${currentYear - 1}/${currentYear}`;

  const [data, setData] = useState<AdrData>({
    beekeeper_name: '',
    beekeeper_id: '',
    address: '',
    phone: '',
    email: '',
    season,
    total_apiaries: overview.loading ? 0 : overview.sites.length,
    total_hives: overview.loading ? 0 : overview.totalHives,
    afb_found: false,
    afb_hives_destroyed: 0,
    treatments_used: '',
    varroa_treatments: '',
    hives_moved: false,
    movement_details: '',
    declaration_date: new Date().toISOString().slice(0, 10),
  });

  const [generated, setGenerated] = useState(false);

  function update<K extends keyof AdrData>(key: K, value: AdrData[K]) {
    setData(prev => ({ ...prev, [key]: value }));
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerated(true);
  }

  if (generated) {
    return (
      <div className="hq-card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Apiary Disease Return — {data.season}</h2>
        <div style={{ fontSize: 13, lineHeight: 2, color: 'var(--ink)' }}>
          <div><strong>Beekeeper:</strong> {data.beekeeper_name}</div>
          <div><strong>Registration ID:</strong> {data.beekeeper_id}</div>
          <div><strong>Address:</strong> {data.address}</div>
          <div><strong>Phone:</strong> {data.phone}</div>
          <div><strong>Email:</strong> {data.email}</div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '8px 0' }} />
          <div><strong>Season:</strong> {data.season}</div>
          <div><strong>Total apiaries:</strong> {data.total_apiaries}</div>
          <div><strong>Total hives:</strong> {data.total_hives}</div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '8px 0' }} />
          <div><strong>AFB found:</strong> {data.afb_found ? 'Yes' : 'No'}</div>
          {data.afb_found && <div><strong>Hives destroyed:</strong> {data.afb_hives_destroyed}</div>}
          <div><strong>Treatments used:</strong> {data.treatments_used || 'None'}</div>
          <div><strong>Varroa treatments:</strong> {data.varroa_treatments || 'None'}</div>
          <div><strong>Hives moved between apiaries:</strong> {data.hives_moved ? 'Yes' : 'No'}</div>
          {data.hives_moved && <div><strong>Movement details:</strong> {data.movement_details}</div>}
          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '8px 0' }} />
          <div><strong>Declaration date:</strong> {data.declaration_date}</div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}>
          This is a preview. The official ADR must be submitted through MPI or HiveHub.
          hivehq does not submit this form on your behalf.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="hq-btn-primary" onClick={() => window.print()} style={{ flex: 1 }}>
            Print / PDF
          </button>
          <button className="hq-btn-secondary" onClick={() => setGenerated(false)} style={{ flex: 1 }}>
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleGenerate} className="hq-card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Apiary Disease Return (ADR)</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>
        Required annually by MPI for all registered beekeepers. Pre-filled from your data where possible.
      </p>

      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>Beekeeper details</h3>

      <div className="hq-field">
        <label className="hq-label">Full name *</label>
        <input type="text" value={data.beekeeper_name} onChange={e => update('beekeeper_name', e.target.value)} required
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
      </div>

      <div className="hq-field">
        <label className="hq-label">DECA / Beekeeper registration ID *</label>
        <input type="text" value={data.beekeeper_id} onChange={e => update('beekeeper_id', e.target.value)} required
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
      </div>

      <div className="hq-field">
        <label className="hq-label">Address</label>
        <input type="text" value={data.address} onChange={e => update('address', e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div className="hq-field">
          <label className="hq-label">Phone</label>
          <input type="tel" value={data.phone} onChange={e => update('phone', e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
        </div>
        <div className="hq-field">
          <label className="hq-label">Email</label>
          <input type="email" value={data.email} onChange={e => update('email', e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
        </div>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, margin: '16px 0 8px', color: 'var(--ink)' }}>Apiary details</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div className="hq-field">
          <label className="hq-label">Season</label>
          <input type="text" value={data.season} onChange={e => update('season', e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
        </div>
        <div className="hq-field">
          <label className="hq-label">Total apiaries</label>
          <input type="number" value={data.total_apiaries} onChange={e => update('total_apiaries', parseInt(e.target.value) || 0)}
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
        </div>
        <div className="hq-field">
          <label className="hq-label">Total hives</label>
          <input type="number" value={data.total_hives} onChange={e => update('total_hives', parseInt(e.target.value) || 0)}
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
        </div>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, margin: '16px 0 8px', color: 'var(--ink)' }}>Disease and treatment</h3>

      <div className="hq-field">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input type="checkbox" checked={data.afb_found} onChange={e => update('afb_found', e.target.checked)} />
          AFB (American Foulbrood) found this season
        </label>
      </div>

      {data.afb_found && (
        <div className="hq-field">
          <label className="hq-label">Number of hives destroyed</label>
          <input type="number" value={data.afb_hives_destroyed} onChange={e => update('afb_hives_destroyed', parseInt(e.target.value) || 0)} min="0"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
        </div>
      )}

      <div className="hq-field">
        <label className="hq-label">Treatments used (disease)</label>
        <input type="text" value={data.treatments_used} onChange={e => update('treatments_used', e.target.value)} placeholder="e.g. oxytetracycline"
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
      </div>

      <div className="hq-field">
        <label className="hq-label">Varroa treatments</label>
        <input type="text" value={data.varroa_treatments} onChange={e => update('varroa_treatments', e.target.value)} placeholder="e.g. Apivar, oxalic acid"
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
      </div>

      <div className="hq-field">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input type="checkbox" checked={data.hives_moved} onChange={e => update('hives_moved', e.target.checked)} />
          Hives moved between apiaries this season
        </label>
      </div>

      {data.hives_moved && (
        <div className="hq-field">
          <label className="hq-label">Movement details</label>
          <textarea value={data.movement_details} onChange={e => update('movement_details', e.target.value)} rows={2}
            placeholder="List movements: from site → to site, number of hives, dates"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
        </div>
      )}

      <div className="hq-field">
        <label className="hq-label">Declaration date</label>
        <input type="date" value={data.declaration_date} onChange={e => update('declaration_date', e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 14 }} />
      </div>

      <button type="submit" className="hq-btn-primary" disabled={!data.beekeeper_name || !data.beekeeper_id} style={{ width: '100%', marginTop: 8 }}>
        Generate ADR preview
      </button>
    </form>
  );
}
