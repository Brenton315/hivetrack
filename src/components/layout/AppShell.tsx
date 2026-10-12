import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import BottomNav from './BottomNav';
import { useTheme } from '../../lib/theme';

const navItems = [
  { path: '/', label: 'Overview', icon: <svg className="icon" width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg> },
  { path: '/sites', label: 'Sites', icon: <svg className="icon" width="18" height="18" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg> },
  { path: '/hives', label: 'Hives', icon: <svg className="icon" width="18" height="18" viewBox="0 0 24 24"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /></svg> },
  { path: '/harvests', label: 'Harvests', icon: <svg className="icon" width="18" height="18" viewBox="0 0 24 24"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></svg> },
  { path: '/reports', label: 'Reports', icon: <svg className="icon" width="18" height="18" viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /></svg> },
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
