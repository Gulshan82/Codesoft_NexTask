import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../features/themeSlice';
import { logout } from '../../features/authSlice';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  CheckCheck,
  Trash2,
  ChevronDown,
  User as UserIcon,
  LogOut,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../UI/GlassCard';

const Navbar = ({ onMenuClick, title = 'Dashboard' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { mode } = useSelector((state) => state.theme);
  const { user } = useSelector((state) => state.auth);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications(!!user);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleNotificationClick = (n) => {
    markAsRead(n._id);
    setIsNotifOpen(false);
    if (n.project) {
      navigate(`/projects/${n.project._id || n.project}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-md border-b dark:bg-slate-900/60 dark:border-slate-800/80 bg-white/70 border-slate-200/80">
      {/* Left: Mobile menu toggle + page title */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 md:flex-initial">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl lg:hidden text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight truncate">
          {title}
        </h2>
      </div>

      {/* Center: Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center w-full max-w-sm relative mx-4">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          placeholder="Search projects or tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 bg-slate-50/50 text-slate-800 dark:text-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-400"
        />
      </form>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-4">
        {/* Light/Dark mode switcher */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-violet-500" />}
        </button>

        {/* Notifications Popover */}
        {user && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 sm:w-80 z-50">
                  <GlassCard className="overflow-hidden p-4 border-slate-300 dark:border-slate-800 shadow-2xl !bg-white dark:!bg-slate-900">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                      <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                        Notifications ({unreadCount} unread)
                      </h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">
                          No notifications yet
                        </p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`p-2.5 rounded-lg border transition-colors cursor-pointer text-left relative group
                              ${
                                notif.isRead
                                  ? 'bg-transparent border-slate-100 dark:border-slate-900'
                                  : 'bg-violet-500/5 border-violet-500/10 hover:bg-violet-500/10'
                              }
                            `}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium pr-4 leading-relaxed">
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-slate-400 block mt-1">
                              {new Date(notif.createdAt).toLocaleDateString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif._id);
                              }}
                              className="absolute top-2 right-2 p-0.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </GlassCard>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Profile Dropdown */}
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-1 sm:gap-2 pl-1.5 pr-2 sm:pl-2 sm:pr-3 py-1 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs overflow-hidden relative">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover absolute inset-0"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 z-50">
                  <GlassCard className="overflow-hidden p-2 border-slate-300 dark:border-slate-800 shadow-2xl !bg-white dark:!bg-slate-900">
                    <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors text-left"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          dispatch(logout());
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </GlassCard>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
