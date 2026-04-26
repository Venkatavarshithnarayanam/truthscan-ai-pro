import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, History, FileBarChart2,
  Code2, Users, CreditCard, Settings, LogOut, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'AI Detector',     icon: ScanLine,        to: '/dashboard' },
  { label: 'Upload History',  icon: History,         to: '/dashboard/history' },
  { label: 'Reports',         icon: FileBarChart2,   to: '/dashboard/reports' },
  { label: 'API Usage',       icon: Code2,           to: '/dashboard/api', badge: 'Beta' },
  { label: 'Team Access',     icon: Users,           to: '/dashboard/team' },
  { label: 'Billing',         icon: CreditCard,      to: '/dashboard/billing' },
  { label: 'Settings',        icon: Settings,        to: '/dashboard/settings' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const content = (
    <div className="sidebar" style={{}}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-[70px] border-b flex-shrink-0" style={{ borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad-primary)' }}>
            <ScanLine className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm">TruthScan AI <span style={{ color: 'var(--accent-blue)' }}>Pro</span></span>
        </div>
        {/* Mobile close */}
        <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
        {NAV_ITEMS.map(({ label, icon: Icon, to, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue-hi)' }}>
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t px-3 py-4 space-y-1 flex-shrink-0" style={{ borderColor: 'var(--brand-border)' }}>
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ background: 'var(--grad-primary)' }}>
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-semibold truncate">{user.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-nav-item w-full hover:text-rose-400"
          style={{ color: 'var(--text-secondary)' }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{content}</div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-30 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-40 lg:hidden"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
