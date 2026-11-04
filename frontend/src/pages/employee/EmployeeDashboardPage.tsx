import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Clock,
  Send,
  FolderKanban,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../services/api';
import { DashboardMetricsEmployee, Case, Project, CaseMessage, Quotation } from '../../types';

export const EmployeeDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetricsEmployee | null>(null);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [recentMessages, setRecentMessages] = useState<CaseMessage[]>([]);
  const [recentQuotations, setRecentQuotations] = useState<Quotation[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.getEmployeeDashboard();
      if (data.metrics) setMetrics(data.metrics);
      if (data.recentCases) setRecentCases(data.recentCases);
      if (data.assignedProjects) setAssignedProjects(data.assignedProjects);
      if (data.recentCustomerMessages) setRecentMessages(data.recentCustomerMessages);
      if (data.recentQuotations) setRecentQuotations(data.recentQuotations);
    } catch (err) {
      console.error('Failed to fetch employee dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; bg: string; text: string }> = {
      NEW: { label: 'New', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
      UNDER_REVIEW: { label: 'Under Review', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
      MORE_INFO_NEEDED: { label: 'Info Needed', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
      QUOTATION_SENT: { label: 'Quotation Sent', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
      QUOTATION_ACCEPTED: { label: 'Accepted', bg: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-800' },
      IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
      PLANNING: { label: 'Planning', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
      APPROVED: { label: 'Approved', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
      COMPLETED: { label: 'Completed', bg: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-800' },
    };
    const c = config[status] || { label: status, bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operations Dashboard</h1>
          <p className="mt-1 text-xs text-slate-500">
            Daily case management, price quotations, customer chats, and project delivery progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/employee/cases?new=true"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm transition"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Create Case</span>
          </Link>
          <Link
            to="/employee/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition"
          >
            <FolderKanban className="h-3.5 w-3.5 text-slate-500" />
            <span>Projects</span>
          </Link>
        </div>
      </div>

      {/* 5 Operational Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Open Cases */}
        <Link
          to="/employee/cases"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-slate-300 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Open Inquiries</span>
            <Inbox className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{metrics?.openCases ?? 0}</div>
        </Link>

        {/* Pending Review */}
        <Link
          to="/employee/cases?status=UNDER_REVIEW"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-slate-300 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Under Review</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700">{metrics?.pendingReview ?? 0}</div>
        </Link>

        {/* Quotes Awaiting Response */}
        <Link
          to="/employee/cases?status=QUOTATION_SENT"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-slate-300 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Quotes Sent</span>
            <Send className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700">{metrics?.quotesAwaitingResponse ?? 0}</div>
        </Link>

        {/* Active Projects */}
        <Link
          to="/employee/projects"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-slate-300 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Projects</span>
            <FolderKanban className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{metrics?.activeProjects ?? 0}</div>
        </Link>

        {/* Unread Customer Messages */}
        <Link
          to="/employee/messages?unread=true"
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-slate-300 transition group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Unread Msgs</span>
            <MessageSquare className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{metrics?.unreadMessagesCount ?? 0}</div>
        </Link>
      </div>

      {/* Grid: Active Cases & Assigned Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases for Handling */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">Active Cases Requiring Attention</h2>
            </div>
            <Link
              to="/employee/cases"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentCases.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No active cases.</div>
            ) : (
              recentCases.map((c) => (
                <Link
                  key={c.id}
                  to={`/employee/cases/${c.id}`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/80 transition group"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                        {c.caseNumber}
                      </span>
                      {getStatusBadge(c.status)}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 truncate">
                      {c.customerName} • {c.quantity} {c.unit}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Assigned Projects */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">My Operational Projects</h2>
            </div>
            <Link
              to="/employee/projects"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>All projects</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {assignedProjects.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No projects currently assigned to you.</div>
            ) : (
              assignedProjects.map((p) => (
                <Link
                  key={p.id}
                  to={`/employee/projects/${p.id}`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/80 transition group"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {p.projectId}
                      </span>
                      {getStatusBadge(p.status)}
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-slate-800 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500">{p.customer?.name} • Progress: {p.progress}%</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lower Row: Messages & Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Inbound Messages */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">Recent Customer Inbound Messages</h2>
            </div>
            <Link to="/employee/messages" className="text-xs font-semibold text-emerald-700 hover:underline">
              Inbox
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentMessages.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No new messages.</div>
            ) : (
              recentMessages.map((m) => (
                <Link
                  key={m.id}
                  to={`/employee/cases/${m.caseId}`}
                  className="p-4 block hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-900">{m.senderName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{m.case?.caseNumber}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{m.message}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* My Issued Quotations */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">My Issued Quotations</h2>
            </div>
            <Link to="/employee/quotations" className="text-xs font-semibold text-purple-600 hover:underline">
              All quotes
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentQuotations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No quotations created by you yet.</div>
            ) : (
              recentQuotations.map((q) => (
                <Link
                  key={q.id}
                  to={`/employee/cases/${q.caseId}`}
                  className="p-4 block hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-slate-900">{q.quotationNumber}</span>
                    <span className="font-bold text-slate-900">{q.grandTotal.toLocaleString()} SEK</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {q.case?.customerName} • Version {q.version}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboardPage;

