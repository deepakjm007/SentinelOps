import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DataProvider, useData } from '@/store/DataContext';
import { Sidebar, Topbar } from '@/components/Layout';
import { GlobalSearch, NotificationPanel } from '@/components/Panels';
import { CyberBackground } from '@/components/ui';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LogExplorerPage } from '@/pages/LogExplorerPage';
import { EndpointsPage } from '@/pages/EndpointsPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { DetectionRulesPage } from '@/pages/DetectionRulesPage';
import { UseCasesPage } from '@/pages/UseCasesPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { ProfilePage } from '@/pages/ProfilePage';

function AppShell() {
  const { isAuthenticated } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return (
      <>
        <CyberBackground />
        <AuthPage />
      </>
    );
  }

  return (
    <>
      <CyberBackground />
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        <Topbar setMobileOpen={setMobileOpen} onOpenSearch={() => setSearchOpen(true)} onOpenNotifications={() => setNotifOpen(true)} />
        <main className="p-4 md:p-6 min-h-[calc(100vh-3.5rem)]">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/monitoring/logs" element={<LogExplorerPage />} />
            <Route path="/monitoring/endpoints" element={<EndpointsPage />} />
            <Route path="/monitoring/alerts" element={<AlertsPage />} />
            <Route path="/detection/rules" element={<DetectionRulesPage />} />
            <Route path="/detection/use-cases" element={<UseCasesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <AppShell />
      </HashRouter>
    </DataProvider>
  );
}
