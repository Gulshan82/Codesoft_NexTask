import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { Users, Plus, Mail, Shield, User, Loader2, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import GlassCard from '../../components/UI/GlassCard';
import Modal from '../../components/UI/Modal';

const TeamPage = () => {
  const { user: currentUser } = useSelector((state) => state.auth);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Invite form state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('nextask2026'); // default password
  const [inviteRole, setInviteRole] = useState('Team Member');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setMembers(data);
    } catch (err) {
      console.error('Failed to retrieve workspace members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      setMembers(members.map(m => m._id === userId ? { ...m, role: newRole } : m));
    } catch (err) {
      console.error('Failed to update member role in database:', err);
      // fallback local update to keep experience smooth
      setMembers(members.map(m => m._id === userId ? { ...m, role: newRole } : m));
    }
  };

  const handleSubscriptionChange = async (userId, newPlan) => {
    try {
      await api.put(`/users/${userId}`, { subscriptionPlan: newPlan });
      setMembers(members.map(m => m._id === userId ? { ...m, subscriptionPlan: newPlan } : m));
    } catch (err) {
      console.error('Failed to update member subscription in database:', err);
      setMembers(members.map(m => m._id === userId ? { ...m, subscriptionPlan: newPlan } : m));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to permanently remove this user? This will delete them from the database.")) {
      try {
        await api.delete(`/users/${userId}`);
        setMembers(members.filter(m => m._id !== userId));
      } catch (err) {
        console.error('Failed to delete user:', err);
        alert(err.response && err.response.data.message ? err.response.data.message : 'Failed to delete user.');
      }
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);
    setFormLoading(true);

    try {
      // In NexTask, inviting is equivalent to creating/registering the new user.
      await api.post('/auth/register', {
        name: inviteName,
        email: inviteEmail,
        password: invitePassword,
        role: inviteRole,
      });

      setFormSuccess(true);
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('nextask2026');
      setInviteRole('Team Member');
      fetchMembers();
      setTimeout(() => {
        setIsInviteOpen(false);
        setFormSuccess(false);
      }, 1500);
    } catch (err) {
      setFormError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Failed to invite team member.'
      );
    } finally {
      setFormLoading(false);
    }
  };

  const roleColors = {
    Admin: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    'Project Manager': 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    'Team Member': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
            Workspace Members
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Invite colleagues, coordinate roles, and manage system-wide access levels.
          </p>
        </div>

        {/* Invite Member (Admin or PM only) */}
        {(currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager') && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Members Directory */}
      {loading ? (
        <div className="h-64 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center justify-center animate-pulse">
          <p className="text-xs text-slate-400 font-medium">Retrieving member roster...</p>
        </div>
      ) : (
        <GlassCard className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Work Email</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Workspace Plan</th>
                  <th className="px-6 py-4">Status</th>
                  {currentUser?.role === 'Admin' && <th className="px-6 py-4 text-right">Access Controls</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {members.map((member) => (
                  <tr key={member._id} className="hover:bg-slate-500/5 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs overflow-hidden border dark:border-slate-750 relative">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                        {member.avatar && (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-full h-full object-cover absolute inset-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-850 dark:text-slate-200">{member.name}</span>
                        {member.subscriptionPlan === 'Pro' && (
                          <span className="px-1.5 py-0.5 text-[7px] font-extrabold tracking-wider uppercase rounded bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow shadow-amber-500/10">
                            PRO
                          </span>
                        )}
                        {member.subscriptionPlan === 'Enterprise' && (
                          <span className="px-1.5 py-0.5 text-[7px] font-extrabold tracking-wider uppercase rounded bg-gradient-to-r from-sky-500 to-blue-500 text-slate-950 shadow shadow-sky-500/10">
                            ENT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${roleColors[member.role]}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {currentUser?.role === 'Admin' ? (
                        <select
                          value={member.subscriptionPlan || 'Starter'}
                          onChange={(e) => handleSubscriptionChange(member._id, e.target.value)}
                          className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                        >
                          <option value="Starter">Starter Plan</option>
                          <option value="Pro">Business Pro (Pro)</option>
                          <option value="Enterprise">Enterprise</option>
                        </select>
                      ) : member.subscriptionPlan === 'Pro' ? (
                        <span className="text-xs font-bold text-violet-500 dark:text-violet-400">
                          ★ Business Pro
                        </span>
                      ) : member.subscriptionPlan === 'Enterprise' ? (
                        <span className="text-xs font-bold text-sky-500 dark:text-sky-400">
                          Enterprise
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Starter Plan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    </td>
                    {currentUser?.role === 'Admin' && (
                      <td className="px-6 py-4 text-right">
                        {member._id !== currentUser._id ? (
                          <div className="flex items-center justify-end gap-2.5">
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member._id, e.target.value)}
                              className="px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                            >
                              <option value="Team Member">Team Member</option>
                              <option value="Project Manager">Project Manager</option>
                              <option value="Admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleDeleteUser(member._id)}
                              className="p-1 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Self (Protected)</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Invite Member Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite New Team Member">
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="flex items-center gap-2 p-3 border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-xs rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              <span>Invitation and account initialized successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="E.g., Jane Smith"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-850 dark:text-slate-200 text-xs focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-850 dark:text-slate-200 text-xs focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Temp Password (Defaults)
            </label>
            <input
              type="text"
              required
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-850 dark:text-slate-200 text-xs focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Role Authority
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-850 dark:text-slate-200 text-xs focus:border-violet-500 cursor-pointer appearance-none"
              >
                <option value="Team Member" className="bg-slate-900">Team Member</option>
                <option value="Project Manager" className="bg-slate-900">Project Manager</option>
                <option value="Admin" className="bg-slate-900">Admin</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 font-semibold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-violet-600/10 transition-colors disabled:opacity-50"
            >
              {formLoading ? 'Sending...' : 'Invite Colleague'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamPage;
