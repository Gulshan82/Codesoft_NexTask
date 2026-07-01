import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfileState } from '../../features/authSlice';
import api from '../../services/api';
import { User, Mail, Shield, BookOpen, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import GlassCard from '../../components/UI/GlassCard';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Profile Edit fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingPhoto(true);
    setProfileError('');

    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatar(data.fileUrl);
    } catch (err) {
      setProfileError('Failed to upload image. Please try again.');
      console.error(err);
    } finally {
      setUploadingPhoto(false);
    }
  };
  
  // Password Edit fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status alerts
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setProfileLoading(true);

    try {
      const { data } = await api.put('/users/profile', { name, email, bio, avatar });
      dispatch(updateUserProfileState(data));
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (err) {
      setProfileError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Failed to update profile settings.'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      return setPasswordError('New passwords do not match');
    }
    if (newPassword.length < 6) {
      return setPasswordError('New password must be at least 6 characters long');
    }

    setPasswordLoading(true);
    try {
      await api.put('/auth/update-password', { currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 2500);
    } catch (err) {
      setPasswordError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Failed to update password. Verify your current password is correct.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const roleColors = {
    Admin: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    'Project Manager': 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    'Team Member': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your profile, set avatars, and update passwords.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Avatar Overview card */}
        <GlassCard className="p-6 border-slate-200 dark:border-slate-800 text-center lg:col-span-1">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center font-bold text-3xl overflow-hidden shadow-xl border-4 border-white dark:border-slate-800 relative">
              {name ? name.charAt(0).toUpperCase() : 'U'}
              {avatar && (
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full object-cover absolute inset-0"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>
            
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-105 mt-4">
              {user?.name}
            </h3>
            <span className="text-[11px] text-slate-400 block mt-0.5">{user?.email}</span>

            <span className={`inline-block px-3 py-0.5 mt-3 text-[10px] font-bold rounded-full border ${roleColors[user?.role]}`}>
              {user?.role}
            </span>

            {/* Plan Info */}
            {user?.role !== 'Admin' && (
              <div className="mt-5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850 text-left w-full">
                <span className="text-[9px] font-bold text-slate-405 uppercase tracking-wider block">Workspace Subscription</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {user?.subscriptionPlan === 'Pro' 
                      ? '★ Business Pro' 
                      : user?.subscriptionPlan === 'Enterprise' 
                      ? '★ Enterprise Plan' 
                      : 'Starter Plan (Free)'}
                  </span>
                  {user?.subscriptionPlan === 'Pro' ? (
                    <span className="px-1.5 py-0.5 text-[8px] font-black tracking-wider uppercase rounded bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow shadow-amber-500/20">
                      Premium
                    </span>
                  ) : user?.subscriptionPlan === 'Enterprise' ? (
                    <span className="px-1.5 py-0.5 text-[8px] font-black tracking-wider uppercase rounded bg-gradient-to-r from-sky-500 to-blue-500 text-slate-950 shadow shadow-sky-500/20">
                      Enterprise
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase rounded bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-400">
                      Free
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-850 text-left">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Short Bio</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
              {user?.bio || '"No bio information added yet. Edit your profile to update your details."'}
            </p>
          </div>
        </GlassCard>

        {/* Right Side: Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Edit Form */}
          <GlassCard className="p-6 border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-850">
              Personal Information
            </h3>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {profileError && (
                <div className="flex items-center gap-2 p-3 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div className="flex items-center gap-2 p-3 border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-xs rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider mb-1.5">
                  Profile Photo (Avatar)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 bg-slate-50/20 dark:bg-slate-950/10">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xl overflow-hidden border-2 border-white dark:border-slate-800 shadow flex-shrink-0 relative">
                    {name ? name.charAt(0).toUpperCase() : 'U'}
                    {avatar && (
                      <img
                        src={avatar}
                        alt="Preview"
                        className="w-full h-full object-cover absolute inset-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
                        {uploadingPhoto ? 'Uploading...' : 'Upload Image File'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                        />
                      </label>
                      {avatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar('')}
                          className="px-4 py-2 border border-slate-250 dark:border-slate-800 hover:bg-rose-500/10 hover:text-rose-500 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded-xl transition-all"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Upload JPEG, PNG or WEBP. Or paste a direct image URL below.
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Alternatively, enter image URL directly..."
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Professional Bio
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-5 py-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-violet-500/10 hover:from-violet-500 hover:to-indigo-500 transition-colors disabled:opacity-50"
                >
                  {profileLoading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </GlassCard>

          {/* Password Edit Form */}
          <GlassCard className="p-6 border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-850">
              Security Credentials
            </h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="flex items-center gap-2 p-3 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-xs rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Password updated successfully!</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-xs focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
