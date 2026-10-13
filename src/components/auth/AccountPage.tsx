import { useAuth } from '../../lib/hooks';
import { useTheme } from '../../lib/theme';
import { useOrg } from '../../lib/org';
import Logo from '../layout/Logo';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  head_beekeeper: 'Head Beekeeper',
  staff: 'Staff',
};

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { org, role, members, isOwner } = useOrg();

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Account</h1>
        </div>
      </header>

      <div className="hq-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--on-primary)', fontWeight: 600, fontSize: 18
          }}>
            {user?.email?.[0].toUpperCase() ?? '?'}
          </div>
          <div>
            <p style={{ fontWeight: 500, color: 'var(--ink)' }}>{user?.email}</p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>{role ? ROLE_LABELS[role] : 'Beekeeper'}{org ? ` · ${org.name}` : ''}</p>
          </div>
        </div>

        <div className="hq-field">
          <span className="hq-label">Theme</span>
          <div className="hq-seg-group" role="group" aria-label="Colour theme">
            <button type="button" className="hq-seg" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
              <svg className="icon" width="16" height="16" viewBox="0 0 24 24" style={{ strokeWidth: 2 }}>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
              Light
            </button>
            <button type="button" className="hq-seg" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
              <svg className="icon" width="16" height="16" viewBox="0 0 24 24" style={{ strokeWidth: 2 }}>
                <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
              </svg>
              Dark
            </button>
          </div>
        </div>

        <button onClick={signOut} className="hq-btn-secondary" style={{ width: '100%', marginTop: 8 }}>
          Sign out
        </button>
      </div>

      {org && (
        <div className="hq-card" style={{ padding: 20, marginTop: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Organisation</h2>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{org.name}</p>
          {members.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <span className="hq-label" style={{ marginBottom: 8, display: 'block' }}>Team ({members.length})</span>
              {members.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                  <span style={{ color: 'var(--ink)' }}>{m.user_id === user?.id ? 'You' : m.user_id.slice(0, 8) + '...'}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>{ROLE_LABELS[m.role] ?? m.role}</span>
                </div>
              ))}
              {isOwner && (
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                  Invite members by sharing your organisation link (coming soon).
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 16 }}>
        hivehq — Hive management for NZ beekeepers
      </p>
    </>
  );
}
