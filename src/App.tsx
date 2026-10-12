import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './lib/hooks';
import AppShell from './components/layout/AppShell';
import AuthPage from './components/auth/AuthPage';
import OverviewPage from './components/dashboard/OverviewPage';
import SiteList from './components/sites/SiteList';
import SiteDetail from './components/sites/SiteDetail';
import HivesPage from './components/hives/HivesPage';
import HiveDetail from './components/hives/HiveDetail';
import HarvestsPage from './components/harvests/HarvestsPage';
import ChartsPage from './components/charts/ChartsPage';
import AccountPage from './components/auth/AccountPage';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--page)', color: 'var(--muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/sites" element={<SiteList />} />
          <Route path="/sites/:id" element={<SiteDetail />} />
          <Route path="/hives" element={<HivesPage />} />
          <Route path="/hives/:id" element={<HiveDetail />} />
          <Route path="/harvests" element={<HarvestsPage />} />
          <Route path="/reports" element={<ChartsPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
