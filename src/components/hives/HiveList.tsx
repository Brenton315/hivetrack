import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Hive } from '../../lib/database.types';
import HiveForm from './HiveForm';

interface Props {
  siteId: string;
  hives: Hive[];
  onChanged: () => void;
}

export default function HiveList({ siteId, hives, onChanged }: Props) {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="hq-btn-primary" onClick={() => setShowForm(true)}>+ Hive</button>
      </div>

      {hives.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No hives at this site</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {hives.map((hive) => (
            <button
              key={hive.id}
              onClick={() => navigate(`/hives/${hive.id}`)}
              className="hq-trow"
              style={{ gridTemplateColumns: 'minmax(0,1fr) 32px', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}
            >
              <span className="hq-site-name">{hive.name}</span>
              <svg className="icon" width="16" height="16" viewBox="0 0 24 24" style={{ color: 'var(--muted)' }}><path d="M9 18l6-6-6-6" /></svg>
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <HiveForm
          siteId={siteId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onChanged(); }}
        />
      )}
    </div>
  );
}
