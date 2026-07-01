import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/authSlice';
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  Users,
  User,
  LogOut,
  ChevronRight,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import GlassCard from '../UI/GlassCard';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Discussions', path: '/discussions', icon: MessageSquare },
    { name: 'Calendar', path: '/calendar', icon: CalendarDays },
    ...(user?.role === 'Admin' ? [{ name: 'Team Members', path: '/team', icon: Users }] : []),
    { name: 'My Profile', path: '/profile', icon: User },
  ];

  const activeStyle = 'bg-violet-600/10 text-violet-600 dark:text-violet-400 border-r-4 border-violet-500 font-semibold';
  const inactiveStyle = 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200';

  const roleColors = {
    Admin: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    'Project Manager': 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    'Team Member': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <>
      {/* Mobile Sidebar backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 w-64 border-r transition-transform duration-300 lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          backdrop-blur-xl dark:bg-slate-900/80 dark:border-slate-800/80 bg-white/80 border-slate-200/80
        `}
      >
        {/* Logo/Branding */}
        <div className="flex items-center gap-3 px-6 py-5 border-b dark:border-slate-800/80 border-slate-200/80">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
              NexTask
            </h1>
            <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
              Project Hub
            </span>
          </div>
        </div>

        {/* User Card (Collapsed context) */}
        {user && (
          <div className="p-4 mx-4 mt-5 border rounded-xl dark:border-slate-800/80 border-slate-200/80 bg-slate-50/50 dark:bg-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border dark:border-slate-700 bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center font-bold text-sm overflow-hidden shadow-inner relative">
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
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">
                    {user.name}
                  </p>
                  {user.subscriptionPlan === 'Pro' && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 text-[8px] font-extrabold tracking-wider uppercase rounded bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow shadow-amber-500/20">
                      PRO
                    </span>
                  )}
                  {user.subscriptionPlan === 'Enterprise' && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 text-[8px] font-extrabold tracking-wider uppercase rounded bg-gradient-to-r from-sky-500 to-blue-500 text-slate-950 shadow shadow-sky-500/20">
                      ENT
                    </span>
                  )}
                </div>
                <span className={`inline-block px-2 py-0.5 mt-1 text-[10px] font-bold rounded-full border ${roleColors[user.role]}`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation items */}
        <nav className="px-3 py-6 space-y-1.5 overflow-y-auto h-[calc(100vh-210px)]">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3.5 px-4 py-3 text-sm rounded-xl transition-all duration-200
                ${isActive ? activeStyle : inactiveStyle}
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 text-sm rounded-xl text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 mt-8"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
