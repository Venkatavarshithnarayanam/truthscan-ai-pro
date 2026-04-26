import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, ChevronDown, User, Settings, LogOut, Menu, Zap } from 'lucide-react';
import { useAuth, getUserInitials } from '../contexts/AuthContext';

interface TopBarProps {
  onMenuToggle: () => void;
  pageTitle?: string;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuToggle, pageTitle = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleLogout() {
    setDropdownOpen(false);
    logout();
    navigate('/');
  }

  const NOTIFICATIONS = [
    { title: 'Analysis complete', body: 'portrait_photo.jpg — 94% AI confidence', time: '2m ago', dot: 'var(--accent-rose)' },
    { title: 'Model updated', body: 'EfficientNet-B3 v2.1 deployed', time: '1h ago', dot: 'var(--accent-blue)' },
    { title: 'API rate limit', body: 'You used 87% of your monthly quota', time: '3h ago', dot: 'var(--accent-amber)' },
  ];

  return (
    <div className="topbar">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="hidden sm:block">
        <h2 className="text-white font-semibold text-sm">{pageTitle}</h2>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search analyses, reports..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border transition-all outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'var(--brand-border-hi)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent-blue)')}
            onBlur={e => (e.target.style.borderColor = 'var(--brand-border-hi)')}
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Plan badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))', color: 'var(--accent-blue-hi)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <Zap className="w-3 h-3" />
          {user?.plan?.toUpperCase() ?? 'PRO'}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false); }}
            className="relative p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Bell className="w-5 h-5" />
            <span className="notif-dot" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden shadow-2xl z-50"
                style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-border-hi)' }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--brand-border)' }}>
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue-hi)' }}>
                    {NOTIFICATIONS.length} new
                  </span>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--brand-border)' }}>
                  {NOTIFICATIONS.map((n, i) => (
                    <div key={i} className="px-4 py-3 flex gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.dot }} />
                      <div>
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.body}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--grad-primary)' }}>
              {getUserInitials(user)}
            </div>
            <span className="hidden sm:block text-sm font-semibold max-w-[100px] truncate">{user?.name}</span>
            <ChevronDown className="w-3.5 h-3.5 hidden sm:block" style={{ color: 'var(--text-muted)' }} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden shadow-2xl z-50"
                style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-border-hi)' }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--brand-border)' }}>
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                </div>
                <div className="p-1.5">
                  {[
                    { icon: User, label: 'Profile', action: () => { setDropdownOpen(false); navigate('/dashboard/settings'); } },
                    { icon: Settings, label: 'Settings', action: () => { setDropdownOpen(false); navigate('/dashboard/settings'); } },
                  ].map(({ icon: Icon, label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                  <div className="border-t mx-1 my-1" style={{ borderColor: 'var(--brand-border)' }} />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left"
                    style={{ color: 'var(--accent-rose)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244,63,94,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
