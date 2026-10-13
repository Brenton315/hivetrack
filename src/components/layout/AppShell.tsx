import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import BottomNav from './BottomNav';
import { useTheme } from '../../lib/theme';

const navItems = [
  { path: '/', label: 'Overview', icon: <svg className="icon" width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg> },
  { path: '/sites', label: 'Sites', icon: <svg className="icon" width="18" height="18" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg> },
  { path: '/economics', label: 'Economics', icon: <svg className="icon" width="18" height="18" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" /></svg> },
  { path: '/calendar', label: 'Calendar', icon: <svg className="icon" width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
  { path: '/shop', label: 'Shop', icon: <svg className="icon" width="18" height="18" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18M16 10a4 4 0 0 1-8 0" /></svg> },
  { path: '/analysis', label: 'Analysis', icon: <svg className="icon" width="18" height="18" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6" /></svg> },
  { path: '/reports', label: 'Reports', icon: <svg className="icon" width="18" height="18" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg> },
];

function isActive(current: string, path: string) {
  if (path === '/') return current === '/';
  return current.startsWith(path);
}

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="hq-app">
      <nav className="hq-sidebar" aria-label="Main">
        <div className="hq-brand">
          <Logo size={28} />
          <span className="hq-wordmark">hivehq</span>
        </div>

        <div className="hq-nav-list">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`hq-nav-link ${isActive(location.pathname, item.path) ? 'active' : ''}`}
              aria-current={isActive(location.pathname, item.path) ? 'page' : undefined}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="hq-sidebar-footer">
          <button
            className={`hq-nav-link ${location.pathname === '/account' ? 'active' : ''}`}
            onClick={() => navigate('/account')}
            aria-current={location.pathname === '/account' ? 'page' : undefined}
          >
            <svg className="icon" width="18" height="18" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
            Account
          </button>

          <div style={{ padding: '8px 12px', marginTop: '4px' }}>
            <div className="hq-seg-group" role="group" aria-label="Colour theme">
              <button
                type="button"
                className="hq-seg"
                aria-pressed={theme === 'light'}
                aria-label="Light theme"
                onClick={() => setTheme('light')}
              >
                <svg className="icon" width="16" height="16" viewBox="0 0 24 24" style={{ strokeWidth: 2 }}>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              </button>
              <button
                type="button"
                className="hq-seg"
                aria-pressed={theme === 'dark'}
                aria-label="Dark theme"
                onClick={() => setTheme('dark')}
              >
                <svg className="icon" width="16" height="16" viewBox="0 0 24 24" style={{ strokeWidth: 2 }}>
                  <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="hq-content">
        <Outlet />
      </div>

      <BottomNav />
    </div>
  );
}
