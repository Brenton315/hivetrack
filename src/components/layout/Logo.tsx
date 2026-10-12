export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <polygon className="logo-accent" points="12,28 88,28 76,12 24,12" />
      <rect className="logo-a" x="16" y="31" width="68" height="17" rx="3" />
      <rect className="logo-b" x="16" y="50" width="68" height="17" rx="3" />
      <rect className="logo-a" x="16" y="69" width="68" height="17" rx="3" />
      <rect className="logo-accent" x="40" y="79" width="20" height="4" rx="2" />
      <rect className="logo-base" x="12" y="88" width="76" height="6" rx="2" />
    </svg>
  );
}
