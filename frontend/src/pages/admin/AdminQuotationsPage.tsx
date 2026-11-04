import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { Quotation } from '../../types';

export const AdminQuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminDashboard();
      if (data.recentQuotations) {
        setQuotations(data.recentQuotations);
      }
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; bg: string; text: string }> = {
      DRAFT: { label: 'Draft', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600' },
      ISSUED: { label: 'Issued / Active', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
      SUPERSEDED: { label: 'Superseded', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    };
    const c = config[status] || { label: status, bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const filteredQuotes = quotations.filter((q) => {
    if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        q.quotationNumber.toLowerCase().includes(s) ||
        q.case?.customerName.toLowerCase().includes(s) ||
        q.case?.caseNumber.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quotation Management</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Official commercial pricing offers, versioning, line items, and downloadable PDF documents.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quotations by number, customer or case reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="ISSUED">Issued / Active</option>
            <option value="DRAFT">Draft</option>
            <option value="SUPERSEDED">Superseded</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading quotations...</div>
        ) : filteredQuotes.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No quotations found</p>
            <p className="text-xs text-slate-400 mt-1">Quotations can be created inside any customer case detail view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Quotation ID</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Case</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Grand Total</th>
                  <th className="px-4 py-3">Issued Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">PDF & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {q.quotationNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        v{q.version}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-emerald-700 font-medium">
                      {q.case ? (
                        <Link to={`/admin/cases/${q.caseId}`} className="hover:underline">
                          {q.case.caseNumber}
                        </Link>
                      ) : (
                        '–'
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-800 font-medium">
                      {q.case?.customerName || '–'}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {q.grandTotal.toLocaleString()} SEK
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      {getStatusBadge(q.status)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={api.downloadAdminPdfUrl(q.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition"
                        >
                          <Download className="h-3.5 w-3.5 text-slate-500" />
                          <span>PDF</span>
                        </a>
                        <Link
                          to={`/admin/cases/${q.caseId}`}
                          className="p-1 rounded text-slate-400 hover:text-emerald-700 transition"
                          title="View case & quotation"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
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

export default AdminQuotationsPage;

