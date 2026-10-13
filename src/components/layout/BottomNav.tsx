import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Overview', icon: <svg className="icon" width="22" height="22" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg> },
  { path: '/sites', label: 'Sites', icon: <svg className="icon" width="22" height="22" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg> },
  { path: '/hives', label: 'Hives', icon: <svg className="icon" width="22" height="22" viewBox="0 0 24 24"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /></svg> },
  { path: '/map', label: 'Map', icon: <svg className="icon" width="22" height="22" viewBox="0 0 24 24"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4z" /><path d="M8 2v16M16 6v16" /></svg> },
];

const moreItems = [
  { path: '/economics', label: 'Economics' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/shop', label: 'Shop' },
  { path: '/reports', label: 'Reports' },
];

function isActive(current: string, path: string) {
  if (path === '/') return current === '/';
  return current.startsWith(path);
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const moreActive = moreItems.some(m => isActive(location.pathname, m.path));

  return (
    <>
      {showMore && (
        <div className="hq-more-backdrop" onClick={() => setShowMore(false)}>
          <div className="hq-more-menu" onClick={(e) => e.stopPropagation()}>
            {moreItems.map((item) => (
              <button
                key={item.path}
                className={`hq-more-item ${isActive(location.pathname, item.path) ? 'active' : ''}`}
                onClick={() => { navigate(item.path); setShowMore(false); }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
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
        <button
          className={`hq-tab-item ${moreActive ? 'active' : ''}`}
          onClick={() => setShowMore(!showMore)}
        >
          <svg className="icon" width="22" height="22" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
          More
        </button>
      </nav>
    </>
  );
}
