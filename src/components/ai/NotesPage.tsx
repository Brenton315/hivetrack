import { useState } from 'react';
import Logo from '../layout/Logo';
import QuickNote from './QuickNote';
import BulkImport from './BulkImport';

type Tab = 'quick' | 'bulk';

export default function NotesPage() {
  const [tab, setTab] = useState<Tab>('quick');

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>AI Notes</h1>
        </div>
      </header>

      <div className="hq-tabs" role="tablist" style={{ marginBottom: 16 }}>
        <button role="tab" aria-selected={tab === 'quick'} className={`hq-tab ${tab === 'quick' ? 'active' : ''}`} onClick={() => setTab('quick')}>
          Quick note
        </button>
        <button role="tab" aria-selected={tab === 'bulk'} className={`hq-tab ${tab === 'bulk' ? 'active' : ''}`} onClick={() => setTab('bulk')}>
          Bulk import
        </button>
      </div>

      {tab === 'quick' && <QuickNote />}
      {tab === 'bulk' && <BulkImport />}
    </>
  );
}
