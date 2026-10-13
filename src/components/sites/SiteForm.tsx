import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Site } from '../../lib/database.types';

interface Props {
  site?: Site;
  onClose: () => void;
  onSaved: () => void;
}

export default function SiteForm({ site, onClose, onSaved }: Props) {
  const [name, setName] = useState(site?.name ?? '');
  const [hiveCount, setHiveCount] = useState(site?.hive_count ?? 0);
  const [lat, setLat] = useState(site?.lat?.toString() ?? '');
  const [lng, setLng] = useState(site?.lng?.toString() ?? '');
  const [locationText, setLocationText] = useState(site?.location_text ?? '');
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
      name,
      hive_count: hiveCount,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      location_text: locationText || null,
    };

    const result = site
      ? await supabase.from('sites').update(row).eq('id', site.id)
      : await supabase.from('sites').insert(row);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
    } else {
      onSaved();
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      () => setError('Could not get location')
    );
  };

  return (
    <div className="hq-overlay">
      <div className="hq-modal">
        <div className="hq-modal-head">
          <h2>{site ? 'Edit Site' : 'New Site'}</h2>
          <button type="button" onClick={onClose} className="hq-modal-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="hq-field">
            <label className="hq-label" htmlFor="site-name">Site name *</label>
            <input
              id="site-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="hq-input"
              placeholder="e.g. Wairarapa Block"
            />
          </div>

          <div className="hq-field">
            <span className="hq-label">Hive count</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="button" onClick={() => setHiveCount(Math.max(0, hiveCount - 1))} className="hq-btn-secondary" style={{ width: 40, minHeight: 40, padding: 0, justifyContent: 'center' }}>-</button>
              <span style={{ fontSize: 22, fontWeight: 600, minWidth: 40, textAlign: 'center' }}>{hiveCount}</span>
              <button type="button" onClick={() => setHiveCount(hiveCount + 1)} className="hq-btn-secondary" style={{ width: 40, minHeight: 40, padding: 0, justifyContent: 'center' }}>+</button>
            </div>
          </div>

          <div className="hq-field">
            <span className="hq-label">GPS pin</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" type="number" step="any" className="hq-input" style={{ flex: 1 }} />
              <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" type="number" step="any" className="hq-input" style={{ flex: 1 }} />
            </div>
            <button type="button" onClick={handleGetLocation} className="hq-link" style={{ marginTop: 6, fontSize: 13 }}>Use my location</button>
          </div>

          <div className="hq-field">
            <label className="hq-label" htmlFor="site-location">Location description</label>
            <input id="site-location" value={locationText} onChange={(e) => setLocationText(e.target.value)} className="hq-input" placeholder="e.g. End of Mikimiki Rd" />
          </div>

          {error && <p className="hq-error" style={{ marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={saving} className="hq-btn-primary" style={{ width: '100%', minHeight: 44 }}>
            {saving ? 'Saving...' : site ? 'Update Site' : 'Add Site'}
          </button>
        </form>
      </div>
    </div>
  );
}
