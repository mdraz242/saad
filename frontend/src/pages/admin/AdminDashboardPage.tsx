import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Inbox,
  FolderKanban,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  PlusCircle,
  ArrowRight,
  UserPlus,
  PackagePlus,
  MessageSquare,
  Activity,
  Calendar,
  Building2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { DashboardMetricsAdmin, Case, Project, Quotation, CaseMessage, AuditLog } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetricsAdmin | null>(null);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentMessages, setRecentMessages] = useState<CaseMessage[]>([]);
  const [recentQuotations, setRecentQuotations] = useState<Quotation[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminDashboard();
      if (data.metrics) setMetrics(data.metrics);
      if (data.recentCases) setRecentCases(data.recentCases);
      if (data.recentProjects) setRecentProjects(data.recentProjects);
      if (data.recentMessages) setRecentMessages(data.recentMessages);
      if (data.recentQuotations) setRecentQuotations(data.recentQuotations);
      if (data.recentActivity) setRecentActivity(data.recentActivity);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; bg: string; text: string }> = {
      NEW: { label: 'New', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
      UNDER_REVIEW: { label: 'Under Review', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
      MORE_INFO_NEEDED: { label: 'More Info Needed', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
      QUOTATION_SENT: { label: 'Quotation Sent', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
      QUOTATION_ACCEPTED: { label: 'Accepted', bg: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-800' },
      QUOTATION_DECLINED: { label: 'Declined', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
      REQUEST_DECLINED: { label: 'Request Declined', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
      CLOSED: { label: 'Closed', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600' },
      // Project statuses
      PLANNING: { label: 'Planning', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
      QUOTED: { label: 'Quoted', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
      APPROVED: { label: 'Approved', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
      IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
      COMPLETED: { label: 'Completed', bg: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-800' },
      CANCELLED: { label: 'Cancelled', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-500' },
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
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-xs font-medium">Loading system metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Dashboard</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Live DB
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Real-time operational overview across all cases, projects, quotations, and staff activity.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/cases?new=true"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm transition"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Create Case</span>
          </Link>
          <Link
            to="/admin/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition"
          >
            <FolderKanban className="h-3.5 w-3.5 text-slate-500" />
            <span>Create Project</span>
          </Link>
          <Link
            to="/admin/customers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition"
          >
            <UserPlus className="h-3.5 w-3.5 text-slate-500" />
            <span>Add Customer</span>
          </Link>
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition"
          >
            <PackagePlus className="h-3.5 w-3.5 text-slate-500" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Part 2.2: 8 Operational Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* Total Cases */}
        <Link
          to="/admin/cases"
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Cases</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition">
              <Inbox className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics?.totalCases ?? 0}</span>
            <span className="text-[11px] text-slate-400">all time</span>
          </div>
        </Link>

        {/* New Cases */}
        <Link
          to="/admin/cases?status=NEW"
          className="bg-white rounded-xl p-4 border border-emerald-200/90 shadow-sm hover:border-emerald-300 hover:shadow transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">New Cases</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{metrics?.newCases ?? 0}</span>
            <span className="text-[11px] text-emerald-600">awaiting review</span>
          </div>
        </Link>

        {/* Under Review */}
        <Link
          to="/admin/cases?status=UNDER_REVIEW"
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Under Review</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics?.underReviewCases ?? 0}</span>
            <span className="text-[11px] text-blue-600 font-medium">in progress</span>
          </div>
        </Link>

        {/* More Info Needed */}
        <Link
          to="/admin/cases?status=MORE_INFO_NEEDED"
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Info Needed</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <HelpCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{metrics?.moreInfoNeededCases ?? 0}</span>
            <span className="text-[11px] text-slate-400">customer action</span>
          </div>
        </Link>

        {/* Quotations Sent */}
        <Link
          to="/admin/cases?status=QUOTATION_SENT"
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Quotations Sent</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics?.quotationSentCases ?? 0}</span>
            <span className="text-[11px] text-slate-400">awaiting decision</span>
          </div>
        </Link>

        {/* Accepted Quotations */}
        <Link
          to="/admin/cases?status=QUOTATION_ACCEPTED"
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Accepted Quotes</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{metrics?.acceptedQuotationCases ?? 0}</span>
            <span className="text-[11px] text-emerald-600 font-medium">ready to order</span>
          </div>
        </Link>

        {/* Active Projects */}
        <Link
          to="/admin/projects"
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Projects</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics?.activeProjects ?? 0}</span>
            <span className="text-[11px] text-indigo-600 font-medium">in execution</span>
          </div>
        </Link>

        {/* Completed Projects */}
        <Link
          to="/admin/projects?status=COMPLETED"
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Completed Projects</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics?.completedProjects ?? 0}</span>
            <span className="text-[11px] text-slate-400">fulfilled</span>
          </div>
        </Link>
      </div>

      {/* Main Grid: Recent Cases & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">Recent Cases</h2>
            </div>
            <Link
              to="/admin/cases"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {recentCases.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No recent cases recorded.</div>
            ) : (
              recentCases.map((c) => (
                <Link
                  key={c.id}
                  to={`/admin/cases/${c.id}`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/80 transition group"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                        {c.caseNumber}
                      </span>
                      {getStatusBadge(c.status)}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 truncate flex items-center gap-2">
                      <span className="font-medium text-slate-700">{c.customerName}</span>
                      <span>•</span>
                      <span>{c.quantity} {c.unit}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[11px] text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Projects</h2>
            </div>
            <Link
              to="/admin/projects"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View all</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {recentProjects.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No active projects found.</div>
            ) : (
              recentProjects.map((p) => (
                <Link
                  key={p.id}
                  to={`/admin/projects/${p.id}`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/80 transition group"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                        {p.projectId}
                      </span>
                      {getStatusBadge(p.status)}
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-slate-800 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{p.customer?.name} • {p.location}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold text-slate-900">
                      {p.projectValue ? `${p.projectValue.toLocaleString()} SEK` : '–'}
                    </div>
                    <div className="text-[11px] text-slate-400">Progress: {p.progress}%</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lower Row: Messages, Quotations, and Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Customer Messages */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">Recent Messages</h2>
            </div>
            <Link to="/admin/messages" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              Inbox
            </Link>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {recentMessages.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No recent messages.</div>
            ) : (
              recentMessages.map((m) => (
                <Link
                  key={m.id}
                  to={`/admin/cases/${m.caseId}`}
                  className="p-4 block hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-900">{m.senderName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {m.case?.caseNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{m.message}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Quotations */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Quotations</h2>
            </div>
            <Link to="/admin/quotations" className="text-xs font-semibold text-purple-600 hover:text-purple-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {recentQuotations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No quotations generated yet.</div>
            ) : (
              recentQuotations.map((q) => (
                <Link
                  key={q.id}
                  to={`/admin/cases/${q.caseId}`}
                  className="p-4 block hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-slate-900">{q.quotationNumber}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      v{q.version}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-500 truncate">{q.case?.customerName}</span>
                    <span className="font-bold text-slate-900">
                      {q.grandTotal.toLocaleString()} SEK
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Employee Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">Employee Activity</h2>
            </div>
            <Link to="/admin/activity-logs" className="text-xs font-semibold text-slate-600 hover:text-slate-800">
              Audit log
            </Link>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {recentActivity.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No activity recorded.</div>
            ) : (
              recentActivity.map((a) => (
                <div key={a.id} className="p-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{a.staffUser?.name || 'System'}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5 truncate">{a.description || a.details || a.action}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

