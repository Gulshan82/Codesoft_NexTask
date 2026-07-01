import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FolderKanban, Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import GlassCard from '../../components/UI/GlassCard';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [simulatedLink, setSimulatedLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      setSimulatedLink(data.resetUrl);
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Failed to request reset. Make sure the email exists.'
      );
    } finally {
      setLoading(false);
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
              Reset Password
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              We'll help you recover your credentials
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all focus:ring-2 focus:ring-violet-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-violet-600/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center text-emerald-500 mb-2">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">
                Instructions Generated
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A password reset token has been successfully simulated for development purposes. Click the button below to navigate directly to the reset page:
              </p>

              <div className="p-3 bg-violet-600/10 border border-violet-500/20 rounded-xl">
                <Link
                  to={simulatedLink}
                  className="text-xs text-violet-400 hover:underline break-all font-semibold block"
                >
                  {window.location.origin + simulatedLink}
                </Link>
              </div>

              <Link
                to="/login"
                className="inline-block py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
              >
                Return to Login
              </Link>
            </div>
          )}

          {!success && (
            <div className="text-center pt-5">
              <Link to="/login" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default ForgotPassword;
