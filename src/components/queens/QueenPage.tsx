import Logo from '../layout/Logo';

export default function QueenPage() {
  return (
    <>
      <header className="hq-header">
        <div className="hq-brand"><Logo size={26} /><span className="hq-wordmark">hivehq</span></div>
        <div className="hq-title"><h1>Queen Rearing</h1></div>
      </header>
      <div className="hq-coming-soon">
        <div className="hq-coming-soon-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
          </svg>
        </div>
        <h2>Coming Soon</h2>
        <p>Queen rearing management is being redesigned with improved tracking, lineage views, and batch operations.</p>
      </div>
    </>
  );
}
