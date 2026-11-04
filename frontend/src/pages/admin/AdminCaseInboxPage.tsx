import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Building2,
  User,
  Scale,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { api } from '../../services/api';
import { Case, CustomerType, CaseStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';

export const AdminCaseInboxPage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'latestActivity' | 'createdAt'>('latestActivity');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Manual Case Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createData, setCreateData] = useState({
    customerType: 'BUSINESS' as CustomerType,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    productName: 'Ready-mix concrete C25/30',
    quantity: 12,
    unit: 'm³',
    deliveryAddress: '',
    desiredDeliveryDate: '',
    deliveryRequirements: '',
    technicalRequirements: '',
    comments: '',
  });

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '15',
        sortBy,
        sortDir,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.customerType = typeFilter;

      const res = await api.getAdminCases(params);
      setCases(res.cases || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching admin cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, statusFilter, typeFilter, sortBy, sortDir]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCases();
  };

  const handleManualCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.customerName || !createData.customerEmail || !createData.deliveryAddress) {
      alert('Please fill in name, email and delivery address.');
      return;
    }

    setCreating(true);
    try {
      const res = await api.createManualCase(createData);
      setShowCreateModal(false);
      // Reset form
      setCreateData({
        customerType: 'BUSINESS',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        productName: 'Ready-mix concrete C25/30',
        quantity: 12,
        unit: 'm³',
        deliveryAddress: '',
        desiredDeliveryDate: '',
        deliveryRequirements: '',
        technicalRequirements: '',
        comments: '',
      });
      fetchCases();
    } catch (err: any) {
      alert(err.message || 'Failed to create case.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Case Inbox
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming customer inquiries, supplier negotiations, and quotations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCases()}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-nordic text-white text-xs font-semibold hover:bg-brand-nordicDark shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Case for Customer</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search case reference, customer name, email, or telephone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition whitespace-nowrap"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses ({totalCount})</option>
              <option value="NEW">New inquiries</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="MORE_INFO_NEEDED">More info needed</option>
              <option value="QUOTATION_SENT">Quotation sent</option>
              <option value="QUOTATION_ACCEPTED">Quotation accepted</option>
              <option value="QUOTATION_DECLINED">Quotation declined</option>
              <option value="REQUEST_DECLINED">Request declined</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Customer Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Customer Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="BUSINESS">Business / Company</option>
              <option value="INDIVIDUAL">Individual / Private</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Sort by:</span>
            <button
              onClick={() => {
                if (sortBy === 'latestActivity') {
                  setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('latestActivity');
                  setSortDir('desc');
                }
              }}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium transition ${
                sortBy === 'latestActivity'
                  ? 'border-brand-nordic bg-brand-50 text-brand-nordic'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              Latest Activity {sortBy === 'latestActivity' && (sortDir === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'createdAt') {
                  setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('createdAt');
                  setSortDir('desc');
                }
              }}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium transition ${
                sortBy === 'createdAt'
                  ? 'border-brand-nordic bg-brand-50 text-brand-nordic'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              Submission Date {sortBy === 'createdAt' && (sortDir === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-brand-nordic border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-500 font-medium">Loading cases...</span>
          </div>
        ) : cases.length === 0 ? (
          <div className="py-20 text-center px-4">
            <FolderOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No cases found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No customer inquiries match the current search or status filter. Try clearing filters or create a case manually.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Case Reference</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Product & Qty</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4">Latest Activity</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition group">
                    {/* Case Number */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <Link
                        to={`/admin/cases/${c.id}`}
                        className="text-brand-nordic hover:underline"
                      >
                        {c.caseNumber}
                      </Link>
                      {c.isQuoteComparison && (
                        <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-[10px] font-sans font-semibold text-amber-800 border border-amber-200">
                          <Scale className="h-3 w-3" />
                          <span>Compare</span>
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.customerName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                        {c.customerEmail}
                      </div>
                    </td>

                    {/* Customer Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                        {c.customerType === 'BUSINESS' ? (
                          <>
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span>Business</span>
                          </>
                        ) : (
                          <>
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span>Individual</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Product & Qty */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 truncate max-w-[180px]">
                        {c.caseProducts?.[0]?.productName || 'Concrete'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.quantity} {c.unit}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    {/* Submission Date */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString('sv-SE')}
                    </td>

                    {/* Latest Activity */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(c.lastActivityAt).toLocaleDateString('sv-SE')}{' '}
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/cases/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                      >
                        <span>Open Details</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50">
            <div>
              Showing page {page} of {totalPages} ({totalCount} total cases)
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-50 transition"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white disabled:opacity-50 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: MANUAL CASE CREATION */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Inquiry on Behalf of Customer"
        subtitle="Staff manual registration"
        maxWidth="lg"
      >
        <form onSubmit={handleManualCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Customer Type</label>
              <select
                value={createData.customerType}
                onChange={(e) => setCreateData({ ...createData, customerType: e.target.value as CustomerType })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              >
                <option value="BUSINESS">Business / Company</option>
                <option value="INDIVIDUAL">Individual / Private</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Name / Company Name *</label>
              <input
                type="text"
                required
                value={createData.customerName}
                onChange={(e) => setCreateData({ ...createData, customerName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Customer Email *</label>
              <input
                type="email"
                required
                value={createData.customerEmail}
                onChange={(e) => setCreateData({ ...createData, customerEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Customer Phone *</label>
              <input
                type="tel"
                required
                value={createData.customerPhone}
                onChange={(e) => setCreateData({ ...createData, customerPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={createData.productName}
                onChange={(e) => setCreateData({ ...createData, productName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Quantity & Unit</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  step="0.5"
                  value={createData.quantity}
                  onChange={(e) => setCreateData({ ...createData, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-16 px-2 py-2 rounded-lg border border-slate-300"
                />
                <select
                  value={createData.unit}
                  onChange={(e) => setCreateData({ ...createData, unit: e.target.value })}
                  className="flex-1 px-2 py-2 rounded-lg border border-slate-300"
                >
                  <option value="m³">m³</option>
                  <option value="tonnes">t</option>
                  <option value="pieces">pcs</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Delivery Address *</label>
            <input
              type="text"
              required
              value={createData.deliveryAddress}
              onChange={(e) => setCreateData({ ...createData, deliveryAddress: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Desired Delivery Date</label>
              <input
                type="date"
                value={createData.desiredDeliveryDate}
                onChange={(e) => setCreateData({ ...createData, desiredDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Delivery Requirements</label>
              <input
                type="text"
                placeholder="e.g. Pump needed, chute access"
                value={createData.deliveryRequirements}
                onChange={(e) => setCreateData({ ...createData, deliveryRequirements: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
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
              disabled={creating}
              className="px-5 py-2 rounded-lg bg-brand-nordic text-white font-semibold hover:bg-brand-nordicDark disabled:opacity-50"
            >
              {creating ? 'Creating Case...' : 'Create Case & Notify Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

