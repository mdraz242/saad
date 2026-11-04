import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Plus,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  Save,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { Project, ProjectStatus, ProjectMaterial } from '../../types';

export const AdminProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('NEW');
  const [editProgress, setEditProgress] = useState(0);

  // Material Modal
  const [isMatModalOpen, setIsMatModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    productName: '',
    description: '',
    quantity: 10,
    unit: 'm³',
    deliveryAddress: '',
    deliveryDate: '',
    technicalRequirements: '',
  });

  useEffect(() => {
    if (id) fetchProject(id);
  }, [id]);

  const fetchProject = async (projId: string) => {
    setLoading(true);
    try {
      const res = await api.getProject(projId);
      if (res.project) {
        setProject(res.project);
        setEditStatus(res.project.status);
        setEditProgress(res.project.progress);
        setNewMaterial((prev) => ({
          ...prev,
          deliveryAddress: res.project.location,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgressAndStatus = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const res = await api.updateProject(project.id, {
        status: editStatus,
        progress: editProgress,
        statusNote: statusNote || undefined,
      });
      if (res.project) {
        setProject((prev) => ({
          ...prev!,
          status: res.project.status,
          progress: res.project.progress,
        }));
        setStatusNote('');
        fetchProject(project.id);
      }
    } catch (err) {
      console.error('Failed to update project status:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      await api.addProjectMaterial(project.id, {
        ...newMaterial,
        quantity: Number(newMaterial.quantity),
      });
      setIsMatModalOpen(false);
      setNewMaterial({
        productName: '',
        description: '',
        quantity: 10,
        unit: 'm³',
        deliveryAddress: project.location,
        deliveryDate: '',
        technicalRequirements: '',
      });
      fetchProject(project.id);
    } catch (err) {
      console.error('Failed to add material:', err);
    }
  };

  const handleDeleteMaterial = async (matId: string) => {
    if (!project || !confirm('Are you sure you want to remove this material from the project?')) return;
    try {
      await api.deleteProjectMaterial(project.id, matId);
      fetchProject(project.id);
    } catch (err) {
      console.error('Failed to delete material:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Project not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/projects')}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">{project.projectId}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 uppercase">
                {project.status}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">{project.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project.case && (
            <Link
              to={`/admin/cases/${project.case.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm transition"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              <span>Related Case ({project.case.caseNumber})</span>
            </Link>
          )}
        </div>
      </div>

      {/* Grid: Overview & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section A: General Information & Customer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              A. General Information
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block text-slate-400 font-medium">Customer</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{project.customer?.name}</span>
                <span className="text-slate-500 text-[11px]">{project.customer?.email}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Site Location</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{project.location}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Expected Delivery</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {project.expectedDeliveryDate ? new Date(project.expectedDeliveryDate).toLocaleDateString() : 'Not set'}
                </span>
              </div>
            </div>

            {project.description && (
              <div className="text-xs pt-2">
                <span className="block text-slate-400 font-medium mb-1">Project Scope & Notes</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  {project.description}
                </p>
              </div>
            )}
          </div>

          {/* Section B: Materials Required */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-700" />
                <h2 className="text-sm font-bold text-slate-900">B. Materials & Supply Requirements</h2>
              </div>
              <button
                onClick={() => setIsMatModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Material</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {!project.materials || project.materials.length === 0 ? (
                <div className="p-6 text-center text-slate-400">No materials listed for this project.</div>
              ) : (
                project.materials.map((m) => (
                  <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60">
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{m.productName}</span>
                        <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                          {m.quantity} {m.unit}
                        </span>
                      </div>
                      {m.description && <p className="text-slate-600 mt-0.5">{m.description}</p>}
                      {m.technicalRequirements && (
                        <p className="text-[11px] text-amber-700 font-mono mt-1">
                          Specs: {m.technicalRequirements}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteMaterial(m.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      title="Remove material"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section E: Status & Progress Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              E. Project History & Activity Timeline
            </h2>
            <div className="space-y-3">
              {!project.statusHistory || project.statusHistory.length === 0 ? (
                <div className="text-xs text-slate-400">No history logged yet.</div>
              ) : (
                project.statusHistory.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          {h.toStatus} {h.progress !== null ? `(${h.progress}%)` : ''}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{h.notes}</p>
                      {h.changedBy && (
                        <span className="text-[10px] text-slate-400">Updated by {h.changedBy.name}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Commercial Details & Progress Editor */}
        <div className="space-y-6">
          {/* Section D: Progress Controller */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              D. Update Project Progress
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                >
                  <option value="NEW">NEW</option>
                  <option value="PLANNING">PLANNING</option>
                  <option value="QUOTED">QUOTED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-500 font-medium">Completion Progress</label>
                  <span className="font-bold text-slate-900">{editProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Status Change Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Pump truck confirmed, pouring starts tomorrow morning..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <button
                onClick={handleUpdateProgressAndStatus}
                disabled={saving}
                className="w-full py-2 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Updating...' : 'Save Status & Progress'}</span>
              </button>
            </div>
          </div>

          {/* Section C: Commercial Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              C. Commercial Details
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Project Value</span>
                <span className="font-bold text-slate-900 text-sm">
                  {project.projectValue.toLocaleString()} {project.currency}
                </span>
              </div>

              {project.approvedValue && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Approved Subtotal</span>
                  <span className="font-semibold text-slate-800">
                    {project.approvedValue.toLocaleString()} {project.currency}
                  </span>
                </div>
              )}

              {project.vatAmount && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">VAT Amount</span>
                  <span className="text-slate-800">
                    {project.vatAmount.toLocaleString()} {project.currency}
                  </span>
                </div>
              )}

              {project.quotation && (
                <div className="pt-2">
                  <span className="block text-[11px] text-slate-400 mb-1">Linked Quotation</span>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-purple-900 block">
                        {project.quotation.quotationNumber}
                      </span>
                      <span className="text-[10px] text-purple-700">
                        Version {project.quotation.version} • {project.quotation.status}
                      </span>
                    </div>
                    <a
                      href={api.downloadAdminPdfUrl(project.quotation.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-purple-600 text-white font-semibold text-[11px] hover:bg-purple-700 transition"
                    >
                      PDF
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Material Modal */}
      {isMatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Project Material</h3>
            <form onSubmit={handleAddMaterial} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C30/37 Ready-mix concrete"
                  value={newMaterial.productName}
                  onChange={(e) => setNewMaterial({ ...newMaterial, productName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newMaterial.quantity}
                    onChange={(e) => setNewMaterial({ ...newMaterial, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Unit</label>
                  <select
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="m³">m³</option>
                    <option value="tonnes">tonnes</option>
                    <option value="pieces">pieces</option>
                    <option value="pallets">pallets</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Technical Requirements</label>
                <input
                  type="text"
                  placeholder="e.g. Rapid hardening, retarder, slump class S4"
                  value={newMaterial.technicalRequirements}
                  onChange={(e) => setNewMaterial({ ...newMaterial, technicalRequirements: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsMatModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800"
                >
                  Add Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjectDetailPage;

