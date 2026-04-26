import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Construction } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DetectorPage from '../components/DetectorPage';
import { useAuth } from '../contexts/AuthContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':          'AI Detector',
  '/dashboard/history':  'Upload History',
  '/dashboard/reports':  'Reports',
  '/dashboard/api':      'API Usage',
  '/dashboard/team':     'Team Access',
  '/dashboard/billing':  'Billing',
  '/dashboard/settings': 'Settings',
};

function ComingSoon({ page }: { page: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <Construction className="w-10 h-10" style={{ color: 'var(--accent-blue)' }} />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{page}</h2>
      <p className="text-base mb-8" style={{ color: 'var(--text-secondary)' }}>
        This section is under active development and will be available soon.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        {['Enterprise SLA', 'Advanced Analytics', 'Team Collaboration'].map(f => (
          <span key={f} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: 'rgba(59,130,246,0.06)', color: 'var(--accent-blue-hi)', border: '1px solid rgba(59,130,246,0.15)' }}>
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

const DashboardLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const path = location.pathname;
  const pageTitle = PAGE_TITLES[path] ?? 'Dashboard';

  function renderContent() {
    if (path === '/dashboard') return <DetectorPage />;
    if (path === '/dashboard/history')  return <ComingSoon page="Upload History" />;
    if (path === '/dashboard/reports')  return <ComingSoon page="Reports" />;
    if (path === '/dashboard/api')      return <ComingSoon page="API Usage" />;
    if (path === '/dashboard/team')     return <ComingSoon page="Team Access" />;
    if (path === '/dashboard/billing')  return <ComingSoon page="Billing" />;
    if (path === '/dashboard/settings') return <ComingSoon page="Settings" />;
    return <DetectorPage />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-main">
        <TopBar onMenuToggle={() => setSidebarOpen(o => !o)} pageTitle={pageTitle} />

        <AnimatePresence mode="wait">
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col flex-1 overflow-auto"
            style={{ minHeight: 'calc(100vh - var(--topbar-height))' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile sidebar overlay handled inside Sidebar */}
    </div>
  );
};

export default DashboardLayout;
