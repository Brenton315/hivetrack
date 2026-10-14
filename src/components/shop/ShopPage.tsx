import Logo from '../layout/Logo';

export default function ShopPage() {
  return (
    <>
      <header className="hq-header">
        <div className="hq-brand"><Logo size={26} /><span className="hq-wordmark">hivehq</span></div>
        <div className="hq-title"><h1>Marketplace</h1></div>
      </header>
      <div className="hq-coming-soon">
        <div className="hq-coming-soon-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <h2>Coming Soon</h2>
        <p>The marketplace is being redesigned with a full shopping experience, product images, and supplier ordering.</p>
      </div>
    </>
  );
}
