import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './lib/hooks';
import { OrgProvider } from './lib/org';
import AppShell from './components/layout/AppShell';
import AuthPage from './components/auth/AuthPage';
import OverviewPage from './components/dashboard/OverviewPage';
import SiteList from './components/sites/SiteList';
import SiteDetail from './components/sites/SiteDetail';
import HiveDetail from './components/hives/HiveDetail';
import EconomicsPage from './components/economics/EconomicsPage';
import InventoryPage from './components/inventory/InventoryPage';
import ShopPage from './components/shop/ShopPage';
import ChartsPage from './components/charts/ChartsPage';
import QueenPage from './components/queens/QueenPage';
import ReportsPage from './components/reports/ReportsPage';
import AccountPage from './components/auth/AccountPage';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--page)', color: 'var(--muted)' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <OrgProvider userId={user.id}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/sites" element={<SiteList />} />
            <Route path="/sites/:id" element={<SiteDetail />} />
            <Route path="/hives/:id" element={<HiveDetail />} />
            <Route path="/economics" element={<EconomicsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/analysis" element={<ChartsPage />} />
            <Route path="/queens" element={<QueenPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </OrgProvider>
  );
}
