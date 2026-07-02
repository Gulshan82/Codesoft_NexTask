import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfileState } from './features/authSlice';
import api from './services/api';

// Layout
import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import OTPVerify from './pages/Auth/OTPVerify';
import Dashboard from './pages/Dashboard/Dashboard';
import ProjectsList from './pages/Projects/ProjectsList';
import ProjectDetails from './pages/Projects/ProjectDetails';
import CalendarPage from './pages/Calendar/CalendarPage';
import TeamPage from './pages/Team/TeamPage';
import ProfilePage from './pages/Profile/ProfilePage';
import LandingPage from './pages/Landing/LandingPage';
import DiscussionsPage from './pages/Discussions/DiscussionsPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { mode } = useSelector((state) => state.theme);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync theme with HTML node classlist
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  // Fetch and sync user profile from database on load/mount
  useEffect(() => {
    if (isAuthenticated) {
      const syncProfile = async () => {
        try {
          const { data } = await api.get('/users/profile');
          dispatch(updateUserProfileState(data));
        } catch (err) {
          console.error('Failed to sync profile with database:', err);
        }
      };
      syncProfile();
    }
  }, [isAuthenticated, dispatch]);

  // Determine current page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Hub';
    if (path.startsWith('/projects/')) return 'Project Workspace';
    if (path.startsWith('/projects')) return 'Projects Portfolio';
    if (path === '/calendar') return 'Milestones Calendar';
    if (path === '/discussions') return 'Discussions Hub';
    if (path === '/team') return 'Team Members Directory';
    if (path === '/profile') return 'Account Settings';
    return 'NexTask';
  };

  const isAuthRoute = ['/login', '/register', '/forgot-password', '/verify-otp'].some(p => location.pathname.startsWith(p)) || location.pathname.startsWith('/reset-password/');

  if (isAuthRoute || (!isAuthenticated && (location.pathname === '/' || location.pathname === '/pricing'))) {
    return (
      <main className="min-h-screen transition-colors duration-300 bg-mesh-dark">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OTPVerify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className={`min-h-screen flex transition-[background-color,color] duration-150 ${mode === 'dark' ? 'bg-mesh-dark text-slate-100' : 'bg-mesh-light text-slate-805'}`}>
      {/* Sidebar Navigation */}
      <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen min-w-0">
        {/* Top Header Navbar */}
        <Navbar onMenuClick={() => setIsMobileSidebarOpen(true)} title={getPageTitle()} />

        {/* Dynamic Route Content */}
        <main className="flex-grow p-6 overflow-y-auto max-w-7xl w-full mx-auto min-w-0">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProjectsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  {user?.role === 'Admin' ? <TeamPage /> : <Navigate to="/" replace />}
                </ProtectedRoute>
              }
            />
            <Route
              path="/discussions"
              element={
                <ProtectedRoute>
                  <DiscussionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing"
              element={
                <ProtectedRoute>
                  <LandingPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
