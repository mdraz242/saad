import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users2,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FolderKanban,
  Inbox,
  FileSpreadsheet,
  Edit2,
  Check,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { Customer } from '../../types';

export const AdminCustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    companyName: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (id) fetchCustomer(id);
  }, [id]);

  const fetchCustomer = async (custId: string) => {
    setLoading(true);
    try {
      const res = await api.getCustomer(custId);
      if (res.customer) {
        setCustomer(res.customer);
        setEditForm({
          name: res.customer.name,
          companyName: res.customer.companyName || '',
          phone: res.customer.phone,
          address: res.customer.address || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch customer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    try {
      const res = await api.updateCustomer(customer.id, editForm);
      if (res.customer) {
        setCustomer((prev) => ({ ...prev!, ...res.customer }));
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to update customer:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">Customer record not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/customers')}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                {customer.customerType}
              </span>
              <span className="text-xs text-slate-400">Client Profile</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">{customer.name}</h1>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition"
        >
          <Edit2 className="h-3.5 w-3.5 text-slate-500" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Contact'}</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Inquiry Cases</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{customer.cases?.length || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Linked Projects</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{customer.projects?.length || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Total Project Value</span>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {customer.totalProjectValue ? `${customer.totalProjectValue.toLocaleString()} SEK` : '0 SEK'}
          </div>
        </div>
      </div>

      {/* Contact Info or Edit Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
          Contact Details
        </h2>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Company Name</label>
              <input
                type="text"
                value={editForm.companyName}
                onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Delivery / Invoicing Address</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="block text-slate-400 font-medium">Email Address</span>
              <span className="font-semibold text-slate-800 block mt-0.5">{customer.email}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Phone</span>
              <span className="font-semibold text-slate-800 block mt-0.5">{customer.phone}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Company</span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                {customer.companyName || '–'}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Registered Address</span>
              <span className="font-semibold text-slate-800 block mt-0.5">{customer.address || '–'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Linked Cases */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-900">Cases Submitted ({customer.cases?.length || 0})</h2>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {!customer.cases || customer.cases.length === 0 ? (
            <div className="p-6 text-center text-slate-400">No cases recorded for this customer.</div>
          ) : (
            customer.cases.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{c.caseNumber}</span>
                    <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-slate-100 text-slate-700">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    {c.quantity} {c.unit} • {c.deliveryAddress}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                  <Link
                    to={`/admin/cases/${c.id}`}
                    className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                  >
                    <span>View</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Linked Projects */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Projects ({customer.projects?.length || 0})</h2>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {!customer.projects || customer.projects.length === 0 ? (
            <div className="p-6 text-center text-slate-400">No projects linked to this customer.</div>
          ) : (
            customer.projects.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{p.projectId}</span>
                    <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-indigo-50 text-indigo-700">
                      {p.status}
                    </span>
                  </div>
                  <p className="font-medium text-slate-800 mt-0.5">{p.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-900">
                    {p.projectValue ? `${p.projectValue.toLocaleString()} SEK` : '–'}
                  </span>
                  <Link
                    to={`/admin/projects/${p.id}`}
                    className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline"
                  >
                    <span>Details</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerDetailPage;

