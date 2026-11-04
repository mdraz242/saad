import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  Clock,
  User,
  Activity,
} from 'lucide-react';
import { api } from '../../services/api';
import { AuditLog, StaffUser } from '../../types';

export const AdminActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  useEffect(() => {
    fetchLogs();
    fetchStaff();
  }, [actionFilter, staffFilter, entityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (actionFilter !== 'ALL') params.action = actionFilter;
      if (staffFilter !== 'ALL') params.staffId = staffFilter;
      if (entityFilter !== 'ALL') params.entityType = entityFilter;
      if (search) params.search = search;
      const res = await api.getActivityLogs(params);
      if (res.logs) setLogs(res.logs);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.getStaffUsers();
      if (res.staff) setStaffList(res.staff);
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    let color = 'bg-slate-100 text-slate-700 border-slate-200';
    if (action.includes('CREATED') || action.includes('ACCEPTED')) {
      color = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (action.includes('UPDATED') || action.includes('STATUS')) {
      color = 'bg-blue-50 text-blue-800 border-blue-200';
    } else if (action.includes('DECLINED') || action.includes('CLOSED') || action.includes('RESET')) {
      color = 'bg-rose-50 text-rose-800 border-rose-200';
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${color}`}>
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-slate-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Activity & Audit Logs</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Immutable system audit trail tracking all administrative events, status modifications, quotations, and staff logins.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit events, descriptions, or entity IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">All Staff</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">All Entities</option>
            <option value="Case">Case</option>
            <option value="Project">Project</option>
            <option value="Customer">Customer</option>
            <option value="Quotation">Quotation</option>
            <option value="StaffUser">StaffUser</option>
            <option value="ApplicationSettings">Settings</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No activity logs recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">
                          {log.staffUser?.name || 'System / Batch'}
                        </span>
                        {log.staffUser?.role && (
                          <span className="text-[10px] text-slate-400">({log.staffUser.role})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {log.entityType}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {log.description || log.details || '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivityLogsPage;

