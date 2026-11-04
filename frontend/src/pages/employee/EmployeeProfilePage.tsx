import React, { useState, useEffect } from 'react';
import {
  User,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  FileSpreadsheet,
  MessageSquare,
  Save,
} from 'lucide-react';
import { api } from '../../services/api';
import { StaffUser } from '../../types';

export const EmployeeProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile Edit
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getEmployeeProfile();
      if (res.profile) {
        setProfile(res.profile);
        setEditName(res.profile.name);
        setEditPhone(res.profile.phone || '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(null);
    try {
      const res = await api.updateEmployeeProfile({
        name: editName,
        phone: editPhone,
      });
      if (res.profile) {
        setProfile((prev) => ({ ...prev!, name: res.profile.name, phone: res.profile.phone }));
        setProfileSuccess('Profile contact details updated successfully.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.changeEmployeePassword({ currentPassword, newPassword });
      setPasswordSuccess('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-8 text-center text-xs text-slate-500">Profile record not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Account & Profile</h1>
        <p className="mt-1 text-xs text-slate-500">
          Manage your contact credentials, view your active system permissions, and update your login password.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xl font-bold">
            {profile.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{profile.name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                {profile.role}
              </span>
            </div>
            <p className="text-xs text-slate-500">{profile.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Assigned Projects</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {profile._count?.assignedProjects ?? 0}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Quotations Created</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {profile._count?.quotations ?? 0}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Customer Messages</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {profile._count?.messages ?? 0}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Details Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Official Work Email</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Work email can only be altered by an administrator.
              </span>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Direct Telephone / Mobile</label>
              <input
                type="tel"
                placeholder="+46 70 000 0000"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800 transition disabled:opacity-50 mt-2 flex items-center justify-center gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <KeyRound className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">New Password (min 6 characters) *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition disabled:opacity-50 mt-2"
            >
              {savingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Permissions Transparency Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">Your Granted System Permissions</h3>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {profile.permissions && profile.permissions.length > 0 ? (
            profile.permissions.map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px]"
              >
                ✓ {p}
              </span>
            ))
          ) : (
            <span className="text-slate-400 text-xs">No explicit permissions assigned.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfilePage;

