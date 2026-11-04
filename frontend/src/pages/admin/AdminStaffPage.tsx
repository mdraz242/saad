import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, ShieldCheck, Lock, Edit, Check, X, KeyRound } from 'lucide-react';
import { api } from '../../services/api';
import { StaffUser } from '../../types';
import { Modal } from '../../components/Modal';

export const AdminStaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Staff Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE' as 'EMPLOYEE' | 'ADMINISTRATOR',
  });

  // Edit Staff Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [editData, setEditData] = useState({
    name: '',
    role: 'EMPLOYEE' as 'EMPLOYEE' | 'ADMINISTRATOR',
    isActive: true,
  });

  // Password Reset Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<StaffUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.getStaffUsers();
      setStaffList(res.staff || []);
    } catch (err: any) {
      alert(err.message || 'Failed to retrieve staff users. Administrator permission required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStaffUser(createData);
      setShowCreateModal(false);
      setCreateData({ name: '', email: '', password: '', role: 'EMPLOYEE' });
      fetchStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to create staff account.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      await api.updateStaffUser(editingStaff.id, editData);
      setShowEditModal(false);
      fetchStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to update staff account.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget) return;
    try {
      await api.resetStaffPassword(passwordTarget.id, newPassword);
      setShowPasswordModal(false);
      setNewPassword('');
      alert(`Password successfully updated for ${passwordTarget.name}`);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Employee & Access Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Betongportalen internal staff accounts, roles, and security access.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-nordic text-white text-xs font-semibold hover:bg-brand-nordicDark shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Staff Account</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Loading staff accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{s.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          s.role === 'ADMINISTRATOR'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {s.role === 'ADMINISTRATOR' ? (
                          <ShieldCheck className="h-3 w-3 text-purple-700" />
                        ) : (
                          <Shield className="h-3 w-3 text-slate-500" />
                        )}
                        <span>{s.role}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          s.isActive
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{s.isActive ? 'Active' : 'Disabled'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingStaff(s);
                          setEditData({ name: s.name, role: s.role, isActive: s.isActive });
                          setShowEditModal(true);
                        }}
                        className="p-1 text-slate-500 hover:text-slate-800"
                        title="Edit staff details"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setPasswordTarget(s);
                          setNewPassword('');
                          setShowPasswordModal(true);
                        }}
                        className="p-1 text-slate-500 hover:text-slate-800"
                        title="Reset password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE STAFF MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Staff User"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={createData.name}
              onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Staff Email *</label>
            <input
              type="email"
              required
              placeholder="name@betongportalen.se"
              value={createData.email}
              onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Temporary Password (min 6 chars) *</label>
            <input
              type="password"
              required
              minLength={6}
              value={createData.password}
              onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Role</label>
            <select
              value={createData.role}
              onChange={(e) => setCreateData({ ...createData, role: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              <option value="EMPLOYEE">Employee (Manage cases & quotations)</option>
              <option value="ADMINISTRATOR">Administrator (Full settings & staff management)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-brand-nordic text-white font-semibold hover:bg-brand-nordicDark"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT STAFF MODAL */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Staff Account"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Role</label>
            <select
              value={editData.role}
              onChange={(e) => setEditData({ ...editData, role: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="staffActive"
              checked={editData.isActive}
              onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-nordic"
            />
            <label htmlFor="staffActive" className="text-slate-700 font-medium">
              Account is active (can sign in)
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Reset Staff Password"
        subtitle={`Account: ${passwordTarget?.email}`}
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">New Password (min 6 characters) *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

