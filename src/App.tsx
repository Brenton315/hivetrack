import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './lib/hooks';
import AppShell from './components/layout/AppShell';
import AuthPage from './components/auth/AuthPage';
import SiteList from './components/sites/SiteList';
import SiteDetail from './components/sites/SiteDetail';
import HiveDetail from './components/hives/HiveDetail';
import ChartsPage from './components/charts/ChartsPage';
import AccountPage from './components/auth/AccountPage';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="text-4xl mb-2">🐝</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<SiteList />} />
          <Route path="/sites/:id" element={<SiteDetail />} />
          <Route path="/hives/:id" element={<HiveDetail />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
