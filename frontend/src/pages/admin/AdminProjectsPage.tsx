import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Search,
  Filter,
  Plus,
  Calendar,
  MapPin,
  Building2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  CheckCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { Project, ProjectStatus, Customer } from '../../types';

export const AdminProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Project Form state
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    customerId: '',
    location: '',
    projectValue: 0,
    expectedDeliveryDate: '',
    materialName: 'Ready-mix Concrete C28/35',
    materialQuantity: 15,
    materialUnit: 'm³',
    technicalRequirements: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchCustomers();
  }, [statusFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.getProjects(params);
      if (res.projects) setProjects(res.projects);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.getCustomers();
      if (res.customers) setCustomers(res.customers);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (!newProject.name || !newProject.customerId || !newProject.location) {
        throw new Error('Please fill all required project fields.');
      }

      await api.createProject({
        name: newProject.name,
        description: newProject.description,
        customerId: newProject.customerId,
        location: newProject.location,
        projectValue: Number(newProject.projectValue),
        expectedDeliveryDate: newProject.expectedDeliveryDate ? new Date(newProject.expectedDeliveryDate).toISOString() : undefined,
        materials: [
          {
            productName: newProject.materialName,
            quantity: Number(newProject.materialQuantity),
            unit: newProject.materialUnit,
            deliveryAddress: newProject.location,
            technicalRequirements: newProject.technicalRequirements,
          },
        ],
      });

      setIsModalOpen(false);
      setNewProject({
        name: '',
        description: '',
        customerId: '',
        location: '',
        projectValue: 0,
        expectedDeliveryDate: '',
        materialName: 'Ready-mix Concrete C28/35',
        materialQuantity: 15,
        materialUnit: 'm³',
        technicalRequirements: '',
      });
      fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const config: Record<ProjectStatus, { label: string; bg: string; text: string }> = {
      NEW: { label: 'New', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
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

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Management</h1>
          <p className="mt-1 text-xs text-slate-500">
            Track active construction projects, materials supply schedules, commercial milestones, and site deliveries.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by project ID, project name, customer or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">All Project Statuses</option>
            <option value="NEW">New</option>
            <option value="PLANNING">Planning</option>
            <option value="QUOTED">Quoted</option>
            <option value="APPROVED">Approved</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center">
            <FolderKanban className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No projects found</p>
            <p className="text-xs text-slate-400 mt-1">
              Create a new project or convert an existing customer case into a project.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Project ID</th>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Expected Date</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      <Link to={`/admin/projects/${p.id}`} className="hover:text-emerald-700 hover:underline">
                        {p.projectId}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <Link to={`/admin/projects/${p.id}`} className="hover:text-emerald-700">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {p.customer?.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 truncate max-w-[150px]">
                      {p.location}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      {p.projectValue ? `${p.projectValue.toLocaleString()} SEK` : '–'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {p.expectedDeliveryDate ? new Date(p.expectedDeliveryDate).toLocaleDateString() : '–'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to={`/admin/projects/${p.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                      >
                        <span>Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">Create New Project</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stockholm Waterfront Foundation Slab"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Customer *</label>
                <select
                  required
                  value={newProject.customerId}
                  onChange={(e) => setNewProject({ ...newProject, customerId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                >
                  <option value="">Select an existing customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email}) {c.companyName ? `• ${c.companyName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Site Location / Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vasagatan 10, Stockholm"
                    value={newProject.location}
                    onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Project Budget (SEK)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 75000"
                    value={newProject.projectValue || ''}
                    onChange={(e) => setNewProject({ ...newProject, projectValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={newProject.expectedDeliveryDate}
                  onChange={(e) => setNewProject({ ...newProject, expectedDeliveryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              {/* Initial Material Entry */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block font-semibold text-slate-800 mb-2">Initial Material Requirement</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-0.5">Product Name</label>
                    <input
                      type="text"
                      value={newProject.materialName}
                      onChange={(e) => setNewProject({ ...newProject, materialName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Quantity (m³)</label>
                    <input
                      type="number"
                      value={newProject.materialQuantity}
                      onChange={(e) => setNewProject({ ...newProject, materialQuantity: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjectsPage;

