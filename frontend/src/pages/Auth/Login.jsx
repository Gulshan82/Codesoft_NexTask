import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setCredentials } from '../../features/authSlice';
import api from '../../services/api';
import { FolderKanban, Lock, Mail, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import GlassCard from '../../components/UI/GlassCard';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      dispatch(setCredentials({ user: data, token: data.token }));
      navigate('/');
    } catch (err) {
      if (err.response && err.response.status === 403 && err.response.data.isVerified === false) {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        setError(
          err.response && err.response.data.message
            ? err.response.data.message
            : 'Invalid login credentials. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#030712] text-slate-100 overflow-hidden relative">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl animate-pulse-slow pointer-events-none" />

      {/* LEFT SIDE: Visual Showcase (Hidden on mobile, visible on lg screens) */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[62%] p-12 flex-col justify-between relative bg-gradient-to-br from-slate-950 via-[#070b19] to-slate-950 border-r border-slate-900/60 overflow-hidden">
        {/* Abstract vector graphics / grid pattern in background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
        
        {/* Branding header */}
        <Link to="/" className="flex items-center gap-3.5 z-10 hover:opacity-90 transition-opacity cursor-pointer">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/20">
            <FolderKanban className="w-6 h-6" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-200 to-indigo-200 bg-clip-text text-transparent font-sans">
            NexTask Project Hub
          </span>
        </Link>

        {/* Dynamic Mockup Workspace Visuals */}
        <div className="my-auto z-10 max-w-2xl relative select-none pl-6">
          <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          {/* Heading */}
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight font-sans">
            Build better software, <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
              one task at a time.
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-4 max-w-md leading-relaxed font-sans">
            Collaborate in real-time, prioritize backlogs with drag-and-drop, and monitor weekly team velocity with interactive charts.
          </p>

          {/* Mini Interactive Kanban / Dashboard Mockup */}
          <div className="mt-10 p-6 rounded-3xl border border-slate-800 bg-slate-950/40 backdrop-blur-xl shadow-2xl space-y-4 max-w-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workspace Preview</span>
            </div>

            <div className="grid grid-cols-3 gap-3.5">
              {/* Col 1 */}
              <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5 text-left">
                <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider block">To Do</span>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 shadow-sm space-y-2">
                  <div className="h-1.5 w-1/3 rounded bg-amber-500/20 border border-amber-500/30" />
                  <div className="h-2 w-full rounded bg-slate-800" />
                  <div className="h-1.5 w-2/3 rounded bg-slate-850" />
                </div>
              </div>
              {/* Col 2 */}
              <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5 text-left">
                <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider block">In Progress</span>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-violet-500/30 shadow-md shadow-violet-900/5 space-y-2 relative">
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
                  <div className="h-1.5 w-1/2 rounded bg-violet-500/20 border border-violet-500/30" />
                  <div className="h-2 w-full rounded bg-slate-700" />
                  <div className="h-1.5 w-3/4 rounded bg-slate-800" />
                </div>
              </div>
              {/* Col 3 */}
              <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5 text-left">
                <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider block">Completed</span>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 shadow-sm space-y-2 opacity-50">
                  <div className="h-1.5 w-1/4 rounded bg-emerald-500/20 border border-emerald-500/30" />
                  <div className="h-2 w-full rounded bg-slate-800 line-through decoration-slate-650" />
                  <div className="h-1.5 w-1/2 rounded bg-slate-850" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="z-10 text-[10px] text-slate-500 flex items-center gap-6">
          <span>© 2026 NexTask Corp.</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          <span>Real-time Sync Active</span>
        </div>
      </div>

      {/* RIGHT SIDE: Interactive Login Form (Full width on mobile, 38% or 42% on desktop) */}
      <div className="w-full lg:w-[42%] xl:w-[38%] flex items-center justify-center p-6 sm:p-12 z-10 bg-gradient-to-tr from-[#050914] via-[#02050c] to-[#040813]">
        <div className="w-full max-w-md">
          {/* Logo visible only on smaller screens */}
          <div className="flex lg:hidden flex-col items-center mb-8 text-center">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white mb-3 shadow-lg shadow-violet-500/20">
              <FolderKanban className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent font-sans">
              NexTask
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              Enterprise Project Management Platform
            </p>
          </div>

          {/* Desktop Heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none font-sans">
              Sign In
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Welcome back! Please enter your details to sign in.
            </p>
          </div>

          <GlassCard className="p-8 border-slate-800/80 shadow-2xl relative">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-violet-455 hover:text-violet-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all focus:ring-2 focus:ring-violet-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-violet-600/10 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center pt-2 text-xs text-slate-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-violet-400 hover:underline font-semibold">
                  Sign up free
                </Link>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Login;
