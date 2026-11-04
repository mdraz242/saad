import React, { useState, useEffect } from 'react';
import { Settings, Mail, Save, Check, RefreshCw, Eye } from 'lucide-react';
import { api } from '../../services/api';
import { ApplicationSettings, NotificationEmailLog } from '../../types';
import { Modal } from '../../components/Modal';

export const AdminSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'EMAILS'>('SETTINGS');
  const [settings, setSettings] = useState<ApplicationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Email Inspector State
  const [emailLogs, setEmailLogs] = useState<NotificationEmailLog[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [viewingEmail, setViewingEmail] = useState<NotificationEmailLog | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await api.getAdminSettings();
      if (res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailLogs = async () => {
    setLoadingEmails(true);
    try {
      const res = await api.getEmailLogs();
      setEmailLogs(res.emails || []);
    } catch (err) {
      console.error('Fetch emails error:', err);
    } finally {
      setLoadingEmails(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'EMAILS') {
      fetchEmailLogs();
    }
  }, [activeTab]);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await api.updateAdminSettings(settings);
      setSettings(res.settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings. Administrator role required.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500">Loading settings...</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Settings & Email Inspector
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure quotation business defaults, VAT rates, and inspect dispatched emails.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === 'SETTINGS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Business & Quotations
          </button>
          <button
            onClick={() => setActiveTab('EMAILS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === 'EMAILS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Email Inspector
          </button>
        </div>
      </div>

      {/* TAB 1: BUSINESS SETTINGS */}
      {activeTab === 'SETTINGS' && settings && (
        <form onSubmit={handleSettingsSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {savedSuccess && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900 font-semibold">
              <Check className="h-4 w-4 text-emerald-700" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Company Identity (Rendered in Quotation PDFs)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Organization Number (Org nr)</label>
                <input
                  type="text"
                  required
                  value={settings.orgNumber}
                  onChange={(e) => setSettings({ ...settings, orgNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">VAT Number (Momsregistreringsnummer)</label>
                <input
                  type="text"
                  required
                  value={settings.vatNumber}
                  onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Default Moms / VAT Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={settings.defaultVatRate}
                  onChange={(e) => setSettings({ ...settings, defaultVatRate: parseFloat(e.target.value) || 25 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Registered Address</label>
                <input
                  type="text"
                  required
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Support Email</label>
                <input
                  type="email"
                  required
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Support Telephone</label>
                <input
                  type="text"
                  required
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Standard Currency</label>
                <input
                  type="text"
                  required
                  value={settings.currency || 'SEK'}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Measurement Units (Comma separated)</label>
                <input
                  type="text"
                  value={settings.measurementUnits || 'm³,tonnes,pieces,pallets,running meters'}
                  onChange={(e) => setSettings({ ...settings, measurementUnits: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Data Retention (Days)</label>
                <input
                  type="number"
                  value={settings.dataRetentionDays || 1825}
                  onChange={(e) => setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) || 1825 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Quotation Default Terms & Conditions
            </h2>
            <div className="mt-4 text-xs">
              <label className="block font-medium text-slate-700 mb-1">
                Standard Nordic Transport and Unloading Conditions
              </label>
              <textarea
                rows={4}
                required
                value={settings.defaultQuotationTerms}
                onChange={(e) => setSettings({ ...settings, defaultQuotationTerms: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-nordic text-white text-xs font-semibold hover:bg-brand-nordicDark active:scale-[0.99] disabled:opacity-50 transition"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: EMAIL LOG INSPECTOR */}
      {activeTab === 'EMAILS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Dispatched Transactional Emails
              </h2>
              <p className="text-[11px] text-slate-500">
                Inspect OTP verification codes, inquiry confirmations, quotation notices, and customer decisions.
              </p>
            </div>
            <button
              onClick={fetchEmailLogs}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              title="Refresh logs"
            >
              <RefreshCw className={`h-4 w-4 ${loadingEmails ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingEmails ? (
            <div className="py-16 text-center text-xs text-slate-500">Loading email logs...</div>
          ) : emailLogs.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No transactional emails recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Template</th>
                    <th className="py-3 px-4">Case Ref</th>
                    <th className="py-3 px-4">Sent Time</th>
                    <th className="py-3 px-4 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {emailLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{log.toEmail}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{log.subject}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                          {log.template}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{log.caseNumber || '—'}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(log.createdAt).toLocaleString('sv-SE')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewingEmail(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View Content</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EMAIL CONTENT MODAL */}
      <Modal
        isOpen={!!viewingEmail}
        onClose={() => setViewingEmail(null)}
        title={viewingEmail?.subject || 'Email Details'}
        subtitle={`To: ${viewingEmail?.toEmail} • ${viewingEmail?.caseNumber || 'General'}`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1">
            <div><strong>Recipient:</strong> {viewingEmail?.toEmail}</div>
            <div><strong>Template:</strong> {viewingEmail?.template}</div>
            <div><strong>Case Reference:</strong> {viewingEmail?.caseNumber || 'N/A'}</div>
            <div><strong>Dispatched:</strong> {viewingEmail && new Date(viewingEmail.createdAt).toLocaleString('sv-SE')}</div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-slate-200 text-slate-800 whitespace-pre-line leading-relaxed font-sans">
            {viewingEmail?.bodyText}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setViewingEmail(null)}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

