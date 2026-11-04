import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Info,
} from 'lucide-react';
import { api } from '../../services/api';
import { StaffUser, SystemPermission } from '../../types';

export const AdminPermissionsPage: React.FC = () => {
  const [systemPermissions, setSystemPermissions] = useState<SystemPermission[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [currentPermissions, setCurrentPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await api.getPermissionsMatrix();
      if (res.systemPermissions) setSystemPermissions(res.systemPermissions);
      if (res.staff) {
        setStaffList(res.staff);
        // Select first employee by default if exists
        const employee = res.staff.find((s: StaffUser) => s.role === 'EMPLOYEE') || res.staff[0];
        if (employee) {
          setSelectedStaffId(employee.id);
          setCurrentPermissions(employee.permissions || []);
        }
      }
    } catch (err) {
      console.error('Failed to load permissions matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaffId(staffId);
    setSuccessMsg(null);
    const user = staffList.find((s) => s.id === staffId);
    if (user) {
      setCurrentPermissions(user.permissions || []);
    }
  };

  const handleTogglePermission = (permId: string) => {
    if (currentPermissions.includes(permId)) {
      setCurrentPermissions(currentPermissions.filter((p) => p !== permId));
    } else {
      setCurrentPermissions([...currentPermissions, permId]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedStaffId) return;
    setSaving(true);
    setSuccessMsg(null);
    try {
      await api.updateStaffPermissions(selectedStaffId, currentPermissions);
      setSuccessMsg('Permissions updated and applied successfully.');
      // Update local state
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === selectedStaffId ? { ...s, permissions: currentPermissions } : s
        )
      );
    } catch (err) {
      console.error('Failed to save permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  const selectedUser = staffList.find((s) => s.id === selectedStaffId);
  const isSuperAdmin = selectedUser?.role === 'ADMINISTRATOR';

  // Group permissions by category
  const categories = Array.from(new Set(systemPermissions.map((p) => p.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Roles & Permissions</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Granular server-side permission controls. Administrators maintain unrestricted access by default.
          </p>
        </div>

        {selectedUser && !isSuperAdmin && (
          <button
            onClick={handleSavePermissions}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Permissions'}</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Staff Selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Select Staff Member to Configure:
        </label>
        <div className="flex flex-wrap gap-2">
          {staffList.map((s) => {
            const isSelected = s.id === selectedStaffId;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectStaff(s.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {s.name.charAt(0)}
                </div>
                <span>{s.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    s.role === 'ADMINISTRATOR'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {s.role}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix */}
      {selectedUser && (
        <div className="space-y-6">
          {isSuperAdmin ? (
            <div className="p-5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block mb-1">
                  Administrator Super-user ({selectedUser.name})
                </span>
                <p className="text-amber-800">
                  Staff with the <strong>ADMINISTRATOR</strong> role hold unrestricted access to all endpoints, modules, system configurations, and customer records. To restrict access, change their role to Employee in the Employee Management tab.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Configuring granular permissions for {selectedUser.name}</span>
                <span>{currentPermissions.length} granted</span>
              </div>

              {categories.map((cat) => {
                const permsInCategory = systemPermissions.filter((p) => p.category === cat);
                return (
                  <div
                    key={cat}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        {cat}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {permsInCategory.filter((p) => currentPermissions.includes(p.id)).length} of {permsInCategory.length} active
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {permsInCategory.map((perm) => {
                        const isGranted = currentPermissions.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition ${
                              isGranted ? 'bg-emerald-50/20' : ''
                            }`}
                          >
                            <div className="pr-4">
                              <span className="text-xs font-bold text-slate-900 block">
                                {perm.label}
                              </span>
                              <span className="text-[11px] text-slate-500 block mt-0.5">
                                {perm.description}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={() => handleTogglePermission(perm.id)}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPermissionsPage;

