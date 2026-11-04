import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileDown,
  Plus,
  Send,
  MessageSquare,
  Edit,
  CheckCircle,
  XCircle,
  HelpCircle,
  Lock,
  Calendar,
  MapPin,
  Building2,
  User,
  History,
  Trash2,
  Clock,
  ShieldCheck,
  Scale,
  RefreshCw,
  FolderKanban,
} from 'lucide-react';
import { api } from '../../services/api';
import { Case, Quotation, CaseMessage } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';

export const AdminCaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [converting, setConverting] = useState(false);

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Chat message state
  const [staffMessage, setStaffMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Modals
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [infoQuestion, setInfoQuestion] = useState('');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    productName: '',
    quantity: 0,
    unit: '',
    deliveryAddress: '',
    desiredDeliveryDate: '',
    deliveryRequirements: '',
    technicalRequirements: '',
    comments: '',
  });

  // Quotation Editor Modal
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteItems, setQuoteItems] = useState([
    { description: 'Ready-mix concrete delivery', quantity: 12, unit: 'm³', unitPrice: 1400 },
  ]);
  const [quoteValidityDays, setQuoteValidityDays] = useState(14);
  const [quoteTerms, setQuoteTerms] = useState(
    'Quotation valid for 14 days. Subject to accessible delivery road for heavy mixer trucks. 30 minutes discharge included.'
  );
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteVatRate, setQuoteVatRate] = useState(25.0);
  const [issueImmediately, setIssueImmediately] = useState(true);
  const [savingQuote, setSavingQuote] = useState(false);

  const fetchCase = async () => {
    if (!id) return;
    try {
      const res = await api.getAdminCase(id);
      setCaseData(res.case);
      if (res.case) {
        setEditData({
          productName: res.case.caseProducts?.[0]?.productName || '',
          quantity: res.case.quantity,
          unit: res.case.unit,
          deliveryAddress: res.case.deliveryAddress,
          desiredDeliveryDate: res.case.desiredDeliveryDate ? res.case.desiredDeliveryDate.split('T')[0] : '',
          deliveryRequirements: res.case.deliveryRequirements || '',
          technicalRequirements: res.case.technicalRequirements || '',
          comments: res.case.comments || '',
        });

        // Pre-fill quotation item with case specs
        setQuoteItems([
          {
            description: `${res.case.caseProducts?.[0]?.productName || 'Ready-mix concrete'} (${res.case.quantity} ${res.case.unit})`,
            quantity: res.case.quantity,
            unit: res.case.unit,
            unitPrice: 1350,
          },
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load case.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
    const interval = setInterval(fetchCase, 15000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [caseData?.messages]);

  // Actions
  const handleAcceptProcessing = async () => {
    if (!id) return;
    try {
      await api.acceptCaseForProcessing(id);
      fetchCase();
    } catch (err: any) {
      alert(err.message || 'Failed to accept for processing.');
    }
  };

  const handleDeclineRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !declineReason.trim()) {
      alert('Please provide a customer-visible explanation.');
      return;
    }
    try {
      await api.declineCaseRequest(id, declineReason.trim());
      setShowDeclineModal(false);
      setDeclineReason('');
      fetchCase();
    } catch (err: any) {
      alert(err.message || 'Failed to decline request.');
    }
  };

  const handleRequestInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.requestAdditionalInfo(id, infoQuestion.trim());
      setShowRequestInfoModal(false);
      setInfoQuestion('');
      fetchCase();
    } catch (err: any) {
      alert(err.message || 'Failed to update case.');
    }
  };

  const handleCloseCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.closeCase(id, closeReason.trim());
      setShowCloseModal(false);
      setCloseReason('');
      fetchCase();
    } catch (err: any) {
      alert(err.message || 'Failed to close case.');
    }
  };

  const handleConvertToProject = async () => {
    if (!id || converting) return;
    if (!confirm('Convert this customer inquiry into an active project? This will create a project record and link all quoted materials.')) return;
    setConverting(true);
    try {
      const res = await api.convertCaseToProject(id);
      if (res.project) {
        navigate(`/admin/projects/${res.project.id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to convert case to project.');
    } finally {
      setConverting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.updateAdminCase(id, editData);
      setShowEditModal(false);
      fetchCase();
    } catch (err: any) {
      alert(err.message || 'Failed to update case.');
    }
  };

  const handleSendStaffMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !staffMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      await api.sendStaffMessage(id, staffMessage.trim());
      setStaffMessage('');
      fetchCase();
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Quotation Item Helpers
  const addQuoteItem = () => {
    setQuoteItems((prev) => [
      ...prev,
      { description: 'Additional material / Pump service', quantity: 1, unit: 'lot', unitPrice: 0 },
    ]);
  };

  const removeQuoteItem = (idx: number) => {
    if (quoteItems.length === 1) return;
    setQuoteItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuoteItem = (idx: number, field: string, val: any) => {
    setQuoteItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  // Calculated Quotation Totals
  const quoteSubtotal = Math.round(
    quoteItems.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitPrice || 0), 0) * 100
  ) / 100;
  const quoteVatAmount = Math.round(quoteSubtotal * (quoteVatRate / 100) * 100) / 100;
  const quoteGrandTotal = Math.round((quoteSubtotal + quoteVatAmount) * 100) / 100;

  const handleCreateQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingQuote(true);

    try {
      await api.createQuotation(id, {
        validityDays: quoteValidityDays,
        termsAndConditions: quoteTerms,
        notes: quoteNotes,
        vatRate: quoteVatRate,
        items: quoteItems,
        issueImmediately,
      });
      setShowQuoteModal(false);
      fetchCase();
    } catch (err: any) {
      alert(err.message || 'Failed to create quotation.');
    } finally {
      setSavingQuote(false);
    }
  };

  const handleIssueDraftQuotation = async (quotationId: string) => {
    try {
      await api.issueQuotation(quotationId);
      fetchCase();
    } catch (err: any) {
      alert(err.message || 'Failed to issue quotation.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-xs text-slate-500 font-medium">Loading case details...</span>
      </div>
    );
  }

  if (errorMsg || !caseData) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <h2 className="text-lg font-bold text-slate-900">Case Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">{errorMsg || 'Unable to load case record.'}</p>
        <Link to="/admin/cases" className="text-xs font-semibold text-brand-nordic underline">
          ← Back to Case Inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button & Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/cases"
            className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-slate-900">
                {caseData.caseNumber}
              </span>
              <StatusBadge status={caseData.status} />
              {caseData.isQuoteComparison && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-[11px] font-semibold text-amber-800 border border-amber-200">
                  <Scale className="h-3 w-3" />
                  <span>Compare Quote</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Submitted on {new Date(caseData.createdAt).toLocaleDateString('sv-SE')} by {caseData.customerName} ({caseData.customerEmail})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCase()}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Refresh case"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowQuoteModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>
              {caseData.quotations && caseData.quotations.length > 0 ? 'Revise Quote (New Version)' : 'Create Quotation'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Case Request Details, Quotations, Chat (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Request Details Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                Customer Request Specifications
              </h2>
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-2.5 py-1 rounded hover:bg-slate-50 transition"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit Request</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Customer Name</span>
                <span className="font-semibold text-slate-900 text-sm">{caseData.customerName}</span>
                <span className="text-slate-400 text-[11px] block">{caseData.customerType === 'BUSINESS' ? 'Business Client' : 'Private Individual'}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Contact Info</span>
                <span className="text-slate-800 font-medium block">{caseData.customerEmail}</span>
                <span className="text-slate-800 font-medium block">{caseData.customerPhone}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Requested Product</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {caseData.caseProducts?.[0]?.productName || 'Ready-mix Concrete'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Quantity & Unit</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {caseData.quantity} {caseData.unit}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Delivery Location</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {caseData.deliveryAddress}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Desired Delivery Date</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {caseData.desiredDeliveryDate
                    ? new Date(caseData.desiredDeliveryDate).toLocaleDateString('sv-SE')
                    : 'Flexible / Earliest available'}
                </span>
              </div>

              {caseData.deliveryRequirements && (
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block">Delivery Requirements</span>
                  <span className="text-slate-800 mt-0.5 block">{caseData.deliveryRequirements}</span>
                </div>
              )}

              {caseData.technicalRequirements && (
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block">Technical Requirements</span>
                  <span className="text-slate-800 mt-0.5 block">{caseData.technicalRequirements}</span>
                </div>
              )}

              {caseData.comments && (
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block">Customer Comments</span>
                  <span className="text-slate-800 mt-0.5 block">{caseData.comments}</span>
                </div>
              )}

              {/* Compare Quote Specifics */}
              {caseData.isQuoteComparison && caseData.existingQuoteDetails && (
                <div className="sm:col-span-2 p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs">
                  <div className="font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5" />
                    <span>Existing Quote To Compare / Beat:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-800 pt-1">
                    <div><strong>Quoted Price:</strong> {caseData.existingQuoteDetails.currentQuotedPrice || 'N/A'}</div>
                    <div><strong>Quoted Quantity:</strong> {caseData.existingQuoteDetails.quotedQuantity || 'N/A'}</div>
                    <div className="col-span-2"><strong>Terms:</strong> {caseData.existingQuoteDetails.terms || 'N/A'}</div>
                    {caseData.existingQuoteDetails.additionalDescription && (
                      <div className="col-span-2"><strong>Notes:</strong> {caseData.existingQuoteDetails.additionalDescription}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Quotation Management Section (Versioning & Decisions) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                  Quotations & Versioning
                </h2>
                <p className="text-[11px] text-slate-500">
                  All versions preserved. Revisions never overwrite historical customer records.
                </p>
              </div>

              <button
                onClick={() => setShowQuoteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Version</span>
              </button>
            </div>

            {(!caseData.quotations || caseData.quotations.length === 0) ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No quotations created yet for this case. Click "Create Quotation" to prepare an offer.
              </div>
            ) : (
              <div className="space-y-4">
                {caseData.quotations.map((quote) => {
                  const isCurrent = quote.status === 'ISSUED';
                  const latestDecision = quote.decisions && quote.decisions[0];

                  return (
                    <div
                      key={quote.id}
                      className={`p-4 rounded-lg border transition ${
                        isCurrent
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : quote.status === 'SUPERSEDED'
                          ? 'border-slate-200 bg-slate-50/60 opacity-80'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {quote.quotationNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Version {quote.version}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              quote.status === 'ISSUED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : quote.status === 'SUPERSEDED'
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {quote.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {quote.status === 'DRAFT' && (
                            <button
                              onClick={() => handleIssueDraftQuotation(quote.id)}
                              className="px-2.5 py-1 rounded bg-brand-nordic text-white text-xs font-semibold hover:bg-brand-nordicDark transition"
                            >
                              Issue to Customer
                            </button>
                          )}

                          <a
                            href={api.downloadAdminPdfUrl(quote.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition"
                          >
                            <FileDown className="h-3.5 w-3.5 text-slate-500" />
                            <span>PDF</span>
                          </a>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="pt-3 text-xs">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-slate-400 text-[10px] uppercase">
                              <th className="py-1">Item</th>
                              <th className="py-1 text-right">Qty</th>
                              <th className="py-1 text-right">Unit Price</th>
                              <th className="py-1 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {quote.items.map((it, idx) => (
                              <tr key={idx} className="text-slate-700">
                                <td className="py-1.5">{it.description}</td>
                                <td className="py-1.5 text-right">{it.quantity} {it.unit}</td>
                                <td className="py-1.5 text-right">{it.unitPrice.toLocaleString('sv-SE')} kr</td>
                                <td className="py-1.5 text-right font-medium">{it.lineTotal.toLocaleString('sv-SE')} kr</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Totals & Validity */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600">
                        <div className="flex gap-4">
                          <span>Subtotal: {quote.subtotal.toLocaleString('sv-SE')} SEK</span>
                          <span>VAT ({quote.vatRate}%): {quote.vatAmount.toLocaleString('sv-SE')} SEK</span>
                          <span className="font-bold text-slate-900">
                            Grand Total: {quote.grandTotal.toLocaleString('sv-SE')} SEK
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Valid until: {new Date(quote.validityDate).toLocaleDateString('sv-SE')}
                        </div>
                      </div>

                      {/* Customer Decision Record if any */}
                      {latestDecision && (
                        <div
                          className={`mt-3 p-2.5 rounded text-xs flex items-center justify-between ${
                            latestDecision.decision === 'ACCEPTED'
                              ? 'bg-green-100/70 text-green-900 border border-green-200'
                              : 'bg-rose-100/70 text-rose-900 border border-rose-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {latestDecision.decision === 'ACCEPTED' ? (
                              <CheckCircle className="h-4 w-4 text-green-700" />
                            ) : (
                              <XCircle className="h-4 w-4 text-rose-700" />
                            )}
                            <span>
                              Customer Decision on v{quote.version}: <strong>{latestDecision.decision}</strong>
                              {latestDecision.decisionReason && ` (${latestDecision.decisionReason})`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(latestDecision.decidedAt).toLocaleString('sv-SE')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Status History Audit Trail */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <History className="h-4 w-4 text-slate-500" />
              <span>Status History & Audit Trail</span>
            </h2>

            <div className="space-y-3 text-xs">
              {caseData.statusHistory?.map((hist) => (
                <div key={hist.id} className="flex items-start gap-3 text-slate-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold text-slate-900">
                      {hist.toStatus}
                    </span>
                    {hist.changedBy && (
                      <span className="text-slate-500"> by {hist.changedBy.name}</span>
                    )}
                    {hist.notes && (
                      <div className="text-slate-600 mt-0.5">{hist.notes}</div>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(hist.createdAt).toLocaleString('sv-SE')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Case Actions & Chat Widget (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Action Control Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Case Workflow Actions
            </h3>

            <div className="space-y-2">
              {/* Accept for processing */}
              {caseData.status === 'NEW' && (
                <button
                  onClick={handleAcceptProcessing}
                  className="w-full py-2.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition text-left flex items-center justify-between"
                >
                  <span>Accept for Processing</span>
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}

              {/* Decline initial request */}
              {caseData.status === 'NEW' && (
                <button
                  onClick={() => setShowDeclineModal(true)}
                  className="w-full py-2.5 px-3 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition text-left flex items-center justify-between"
                >
                  <span>Decline Request</span>
                  <XCircle className="h-4 w-4" />
                </button>
              )}

              {/* Request additional information */}
              {caseData.status !== 'CLOSED' && (
                <button
                  onClick={() => setShowRequestInfoModal(true)}
                  className="w-full py-2.5 px-3 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-semibold transition text-left flex items-center justify-between"
                >
                  <span>Request More Information</span>
                  <HelpCircle className="h-4 w-4" />
                </button>
              )}

              {/* Convert to Project */}
              <button
                onClick={handleConvertToProject}
                disabled={converting}
                className="w-full py-2.5 px-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold transition text-left flex items-center justify-between disabled:opacity-50"
              >
                <span>{converting ? 'Converting...' : 'Convert to Active Project'}</span>
                <FolderKanban className="h-4 w-4 text-indigo-600" />
              </button>

              {/* Close Case */}
              {caseData.status !== 'CLOSED' && (
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition text-left flex items-center justify-between"
                >
                  <span>Close Case</span>
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Customer Chat Widget */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-brand-nordic" />
                <h3 className="text-xs font-bold text-slate-900">Customer Communication</h3>
              </div>
              <span className="text-[10px] text-slate-400">Emails customer on send</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {(!caseData.messages || caseData.messages.length === 0) ? (
                <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs p-4">
                  No messages yet. Send a note to the customer.
                </div>
              ) : (
                caseData.messages.map((msg) => {
                  const isStaff = msg.senderType === 'STAFF';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-600">
                          {isStaff ? (msg.staffUser?.name || 'Staff') : caseData.customerName}
                        </span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-[88%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                          isStaff
                            ? 'bg-slate-900 text-white'
                            : 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendStaffMessage} className="p-2.5 border-t border-slate-100 flex gap-1.5">
              <input
                type="text"
                placeholder="Reply to customer..."
                value={staffMessage}
                onChange={(e) => setStaffMessage(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-nordic/20"
              />
              <button
                type="submit"
                disabled={sendingMessage || !staffMessage.trim()}
                className="p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL: CREATE / REVISE QUOTATION */}
      <Modal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        title="Quotation Editor"
        subtitle={`Case ${caseData.caseNumber} • ${caseData.customerName}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateQuotationSubmit} className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                Quotation Line Items
              </label>
              <button
                type="button"
                onClick={addQuoteItem}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-nordic hover:underline"
              >
                <Plus className="h-3 w-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {quoteItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <input
                    type="text"
                    required
                    placeholder="Item description (e.g. Ready-mix concrete C30/37)"
                    value={item.description}
                    onChange={(e) => updateQuoteItem(idx, 'description', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                  />
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateQuoteItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1.5 rounded border border-slate-300 text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={item.unit}
                    onChange={(e) => updateQuoteItem(idx, 'unit', e.target.value)}
                    className="w-14 px-2 py-1.5 rounded border border-slate-300 text-xs bg-white"
                  />
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => updateQuoteItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1.5 rounded border border-slate-300 text-xs bg-white"
                  />
                  <span className="font-semibold text-slate-800 w-20 text-right whitespace-nowrap">
                    {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('sv-SE')} kr
                  </span>
                  <button
                    type="button"
                    onClick={() => removeQuoteItem(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Automatic Totals Display */}
          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-600">Subtotal: </span>
              <strong>{quoteSubtotal.toLocaleString('sv-SE')} SEK</strong>
              <span className="mx-2 text-slate-400">•</span>
              <span className="text-slate-600">Moms ({quoteVatRate}%): </span>
              <strong>{quoteVatAmount.toLocaleString('sv-SE')} SEK</strong>
            </div>
            <div className="text-sm font-bold text-emerald-950">
              Total: {quoteGrandTotal.toLocaleString('sv-SE')} SEK
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Validity (Days)</label>
              <input
                type="number"
                min="1"
                max="90"
                value={quoteValidityDays}
                onChange={(e) => setQuoteValidityDays(parseInt(e.target.value, 10) || 14)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">VAT Rate (%)</label>
              <input
                type="number"
                step="0.5"
                value={quoteVatRate}
                onChange={(e) => setQuoteVatRate(parseFloat(e.target.value) || 25)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Terms & Delivery Conditions</label>
            <textarea
              rows={2}
              value={quoteTerms}
              onChange={(e) => setQuoteTerms(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Customer Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Special contractor discount applied. Includes 24m pump setup."
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="issueNow"
              checked={issueImmediately}
              onChange={(e) => setIssueImmediately(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-nordic"
            />
            <label htmlFor="issueNow" className="text-slate-700 font-medium">
              Issue immediately to customer & send email notification
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowQuoteModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingQuote}
              className="px-5 py-2 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50"
            >
              {savingQuote ? 'Saving...' : issueImmediately ? 'Issue Quotation' : 'Save as Draft'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DECLINE REQUEST (INITIAL) */}
      <Modal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        title="Decline Inquiry"
        subtitle="Mandatory customer-visible explanation required"
      >
        <form onSubmit={handleDeclineRequest} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Provide a clear, respectful explanation for why this request cannot be fulfilled (e.g. delivery location outside plant radius, minimum volume requirement not met).
          </p>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Explanation to Customer *</label>
            <textarea
              required
              rows={3}
              placeholder="We are unable to quote for this inquiry because..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowDeclineModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-rose-700 text-white font-semibold hover:bg-rose-800"
            >
              Decline Request & Notify Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: REQUEST MORE INFO */}
      <Modal
        isOpen={showRequestInfoModal}
        onClose={() => setShowRequestInfoModal(false)}
        title="Request Additional Information"
      >
        <form onSubmit={handleRequestInfo} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Ask the customer for needed details. This updates case status to "More info needed" and posts your question directly to their case chat.
          </p>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Question / Prompt for Customer</label>
            <textarea
              required
              rows={3}
              placeholder="Could you please specify if you require an 8m³ chute truck or a pump truck?"
              value={infoQuestion}
              onChange={(e) => setInfoQuestion(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowRequestInfoModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-800"
            >
              Send Request to Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CLOSE CASE */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Close Case"
      >
        <form onSubmit={handleCloseCase} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Closing the case marks it completed in the inbox. Case history and quotations remain preserved for data retention.
          </p>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Resolution Note</label>
            <input
              type="text"
              placeholder="e.g. Delivery completed successfully / Order fulfilled"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCloseModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
            >
              Close Case
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT REQUEST DETAILS */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Customer Request Details"
        subtitle="Changes are logged in the audit trail"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Product Name</label>
            <input
              type="text"
              value={editData.productName}
              onChange={(e) => setEditData({ ...editData, productName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                step="0.5"
                value={editData.quantity}
                onChange={(e) => setEditData({ ...editData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                value={editData.unit}
                onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Delivery Address</label>
            <input
              type="text"
              value={editData.deliveryAddress}
              onChange={(e) => setEditData({ ...editData, deliveryAddress: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Desired Delivery Date</label>
            <input
              type="date"
              value={editData.desiredDeliveryDate}
              onChange={(e) => setEditData({ ...editData, desiredDeliveryDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Delivery Requirements</label>
            <input
              type="text"
              value={editData.deliveryRequirements}
              onChange={(e) => setEditData({ ...editData, deliveryRequirements: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

