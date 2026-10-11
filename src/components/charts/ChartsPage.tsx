import { useState } from 'react';
import StrengthChart from './StrengthChart';
import HarvestChart from './HarvestChart';

type ChartTab = 'strength' | 'harvest';

export default function ChartsPage() {
  const [tab, setTab] = useState<ChartTab>('strength');

  return (
    <div className="px-4 pt-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Charts</h1>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('strength')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'strength' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          Strength
        </button>
        <button
          onClick={() => setTab('harvest')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'harvest' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          Harvest
        </button>
      </div>

      {tab === 'strength' ? <StrengthChart /> : <HarvestChart />}
    </div>
  );
}
