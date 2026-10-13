import { useState } from 'react';
import StrengthChart from './StrengthChart';
import HarvestChart from './HarvestChart';
import AskPanel from './AskPanel';
import Logo from '../layout/Logo';

type ChartTab = 'strength' | 'harvest' | 'ask';

const TAB_EXPLANATIONS: Record<string, string> = {
  strength: 'Tracks colony strength over time, measured as the percentage of frames covered by bees at each inspection. Use it to spot declining hives early and compare performance across sites.',
  harvest: 'Shows honey yield by site and season. Compare production between apiaries and track year-on-year trends to plan equipment and labour.',
  ask: 'Ask a question about your hive data in plain language. The AI will analyse your sites, hives, events and harvests to give you an answer.',
};

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
          <h1>Analysis</h1>
          <span className="hq-subtitle">Strength, harvest trends and AI insights</span>
        </div>
      </header>

      <div className="hq-tabs">
        <button className={`hq-tab ${tab === 'strength' ? 'active' : ''}`} onClick={() => setTab('strength')}>Strength</button>
        <button className={`hq-tab ${tab === 'harvest' ? 'active' : ''}`} onClick={() => setTab('harvest')}>Harvest</button>
        <button className={`hq-tab ${tab === 'ask' ? 'active' : ''}`} onClick={() => setTab('ask')}>Ask AI</button>
      </div>

      <div className="hq-card" style={{ padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
        {TAB_EXPLANATIONS[tab]}
      </div>

      {tab === 'strength' && <StrengthChart />}
      {tab === 'harvest' && <HarvestChart />}
      {tab === 'ask' && <AskPanel />}
    </>
  );
}
