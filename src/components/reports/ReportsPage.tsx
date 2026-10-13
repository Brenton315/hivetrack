import { useState } from 'react';
import Logo from '../layout/Logo';
import AdrForm from './AdrForm';

type ReportTab = 'adr' | 'coi' | 'afb' | 'harvest';

const TABS: { key: ReportTab; label: string }[] = [
  { key: 'adr', label: 'ADR' },
  { key: 'coi', label: 'COI' },
  { key: 'afb', label: 'AFB' },
  { key: 'harvest', label: 'Harvest' },
];

function PlaceholderReport({ title, description, note }: { title: string; description: string; note: string }) {
  return (
    <div className="hq-card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{title}</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>{description}</p>
      <div style={{
        padding: '12px 16px', borderRadius: 8, background: 'var(--surface)',
        border: '1px dashed var(--line)', textAlign: 'center',
      }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>Coming soon</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{note}</p>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('adr');

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Reports</h1>
          <span className="hq-subtitle">Compliance and regulatory documents</span>
        </div>
      </header>

      <div className="hq-tabs" role="tablist" style={{ marginBottom: 16 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`hq-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'adr' && <AdrForm />}

      {tab === 'coi' && (
        <PlaceholderReport
          title="Certificate of Inspection (COI)"
          description="Issued after an apiary inspection, confirms disease-free status for a specific site. Required for selling hives or moving bees between regions."
          note="This will generate a COI from your most recent inspection data for a selected site. Integration with AsureQuality inspection records is planned."
        />
      )}

      {tab === 'afb' && (
        <PlaceholderReport
          title="AFB Declaration"
          description="American Foulbrood elimination declaration for hive movements and sales. Required under the Biosecurity (National American Foulbrood Pest Management Plan) Order."
          note="This will generate an AFB-free declaration based on your inspection history. All hives at the declared site must have been inspected within the required window."
        />
      )}

      {tab === 'harvest' && (
        <PlaceholderReport
          title="Harvest Declaration"
          description="Honey harvest records for traceability, RMP compliance, and export certification. Required by MPI for all commercial beekeepers."
          note="This will compile your harvest records into a declaration with batch numbers, weights, honey types, and site locations. Pre-filled from your recorded harvests."
        />
      )}

      <div className="hq-card" style={{ padding: 16, marginTop: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>HiveHub integration</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 8 }}>
          HiveHub is the MPI system for managing apiary registrations and disease returns.
          Integration would allow direct submission of ADRs and access to apiary registration data.
        </p>
        <p style={{ fontSize: 12, color: 'var(--fair)', lineHeight: 1.5 }}>
          Status: Researching. We have not confirmed whether HiveHub offers a public API.
          No API calls will be made without your explicit confirmation.
        </p>
      </div>
    </>
  );
}
