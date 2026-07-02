import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../features/authSlice';
import api from '../../services/api';
import { FolderKanban, Loader2, AlertCircle, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import GlassCard from '../../components/UI/GlassCard';

const OTPVerify = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from query parameter
  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timer, setTimer] = useState(0);

  // Handle countdown for resend button
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp) {
      setError('Please fill in both Email and OTP Code');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      setSuccessMsg('Email verified successfully! Redirecting...');
      setTimeout(() => {
        dispatch(setCredentials({ user: data, token: data.token }));
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Invalid or expired OTP code. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please provide an email address first.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      const { data } = await api.post('/auth/resend-otp', { email });
      setSuccessMsg(data.message || 'A new OTP has been sent to your email.');
      setTimer(60); // 60 seconds cooldown
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Failed to resend OTP. Please check the email and try again.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-mesh-dark">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl animate-pulse-slow pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <GlassCard className="p-8 border-slate-800 shadow-2xl relative">
          <div className="flex flex-col items-center mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white mb-3 shadow-lg shadow-violet-500/20">
              <FolderKanban className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Verify Email
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium text-center">
              Please enter the 6-digit verification code sent to your email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!emailParam}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm placeholder:text-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                OTP Code (6 Digits)
              </label>
              <input
                type="text"
                required
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-center text-xl font-mono tracking-[8px] placeholder:text-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all focus:ring-2 focus:ring-violet-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-violet-600/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                'Verify & Sign In'
              )}
            </button>
          </form>

          <div className="flex items-center justify-between pt-5 border-t border-slate-900/60 mt-5">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>

            <button
              type="button"
              onClick={handleResend}
              disabled={timer > 0 || resending}
              className="inline-flex items-center gap-2 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default OTPVerify;
