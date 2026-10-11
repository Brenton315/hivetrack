import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Sites', icon: '📍' },
  { path: '/charts', label: 'Charts', icon: '📊' },
  { path: '/account', label: 'Account', icon: '👤' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center py-2 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-xs transition-colors ${
              isActive(tab.path)
                ? 'text-amber-600 font-semibold'
                : 'text-gray-400'
            }`}
          >
            <span className="text-xl mb-0.5">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
