import { useState } from 'react';
import StrengthChart from './StrengthChart';
import HarvestChart from './HarvestChart';
import Logo from '../layout/Logo';

type ChartTab = 'strength' | 'harvest';

export default function ChartsPage() {
  const [tab, setTab] = useState<ChartTab>('strength');

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Reports</h1>
          <span className="hq-subtitle">Strength and harvest trends</span>
        </div>
      </header>

      <div className="hq-tabs">
        <button className={`hq-tab ${tab === 'strength' ? 'active' : ''}`} onClick={() => setTab('strength')}>Strength</button>
        <button className={`hq-tab ${tab === 'harvest' ? 'active' : ''}`} onClick={() => setTab('harvest')}>Harvest</button>
      </div>

      {tab === 'strength' ? <StrengthChart /> : <HarvestChart />}
    </>
  );
}
