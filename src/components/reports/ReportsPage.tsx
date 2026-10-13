import Logo from '../layout/Logo';

const REPORT_TYPES = [
  {
    title: 'Apiary Disease Return (ADR)',
    description: 'Annual declaration required by MPI for all registered beekeepers in New Zealand.',
    status: 'Coming soon',
  },
  {
    title: 'Certificate of Inspection (COI)',
    description: 'Issued after an apiary inspection, confirms disease-free status.',
    status: 'Coming soon',
  },
  {
    title: 'AFB Declaration',
    description: 'American Foulbrood elimination declaration for hive movements and sales.',
    status: 'Coming soon',
  },
  {
    title: 'Harvest Declaration',
    description: 'Honey harvest records for traceability and compliance.',
    status: 'Coming soon',
  },
];

export default function ReportsPage() {
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

      <div className="hq-card" style={{ padding: 24 }}>
        <p style={{ color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
          Generate and manage compliance reports for MPI and industry requirements.
          Reports will be pre-filled from your site and hive data.
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          {REPORT_TYPES.map((r) => (
            <div key={r.title} className="hq-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{r.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>{r.description}</p>
              </div>
              <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', padding: '4px 10px', borderRadius: 12, background: 'var(--card-border)', flexShrink: 0 }}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
