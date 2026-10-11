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
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium active:bg-amber-600"
        >
          + Hive
        </button>
      </div>

      {hives.length === 0 ? (
        <p className="text-center text-gray-400 py-6">No hives at this site</p>
      ) : (
        <div className="flex flex-col gap-2">
          {hives.map((hive) => (
            <button
              key={hive.id}
              onClick={() => navigate(`/hives/${hive.id}`)}
              className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100 active:scale-[0.98] transition-transform text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🐝</span>
                <span className="font-medium text-gray-900">{hive.name}</span>
              </div>
              <span className="text-gray-400 text-sm">→</span>
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
