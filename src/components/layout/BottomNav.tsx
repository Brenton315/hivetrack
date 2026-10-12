import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Overview', icon: <svg className="icon" width="22" height="22" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg> },
  { path: '/sites', label: 'Sites', icon: <svg className="icon" width="22" height="22" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg> },
  { path: '/hives', label: 'Hives', icon: <svg className="icon" width="22" height="22" viewBox="0 0 24 24"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /></svg> },
  { path: '/harvests', label: 'Harvests', icon: <svg className="icon" width="22" height="22" viewBox="0 0 24 24"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></svg> },
];

function isActive(current: string, path: string) {
  if (path === '/') return current === '/';
  return current.startsWith(path);
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="hq-tabbar" aria-label="Main">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          className={`hq-tab-item ${isActive(location.pathname, tab.path) ? 'active' : ''}`}
          aria-current={isActive(location.pathname, tab.path) ? 'page' : undefined}
          onClick={() => navigate(tab.path)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
