import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileDown,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  AlertTriangle,
  LogOut,
  MapPin,
  Calendar,
  Layers,
  Edit3,
  Clock,
  ShieldCheck,
  Check,
  Building2,
  User,
  Info,
} from 'lucide-react';
import { api, customerSession } from '../services/api';
import { Case, Quotation, CaseMessage } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

export const CustomerCaseDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [currentQuotation, setCurrentQuotation] = useState<Quotation | null>(null);
  const [quotationHistory, setQuotationHistory] = useState<Quotation[]>([]);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Modals
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [processingDecision, setProcessingDecision] = useState(false);

  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyData, setModifyData] = useState({
    quantity: 0,
    deliveryAddress: '',
    deliveryRequirements: '',
    comments: '',
  });

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchCaseDetails = async () => {
    try {
      const res = await api.getCustomerCase();
      setCaseData(res.case);
      setCurrentQuotation(res.currentQuotation);
      setQuotationHistory(res.quotationHistory || []);
      setMessages(res.messages || []);

      if (res.case) {
        setModifyData({
          quantity: res.case.quantity,
          deliveryAddress: res.case.deliveryAddress,
          deliveryRequirements: res.case.deliveryRequirements || '',
          comments: res.case.comments || '',
        });
      }
    } catch (err: any) {
      console.error('Fetch customer case error:', err);
      setErrorMsg(err.message || 'Unable to retrieve case details. Session may have expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = customerSession.loadFromSession();
    if (!session.token) {
      navigate('/find-case');
      return;
    }
    fetchCaseDetails();

    // Auto refresh every 15s to keep messages & quotations in sync
    const interval = setInterval(fetchCaseDetails, 15000);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEndSession = () => {
    customerSession.clearSession();
    navigate('/');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await api.sendCustomerMessage(newMessage.trim());
      setMessages((prev) => [...prev, res.message]);
      setNewMessage('');
      fetchCaseDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleConfirmAccept = async () => {
    if (!currentQuotation) return;
    setProcessingDecision(true);
    try {
      await api.acceptQuotation(currentQuotation.id);
      setShowAcceptModal(false);
      await fetchCaseDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to accept quotation.');
    } finally {
      setProcessingDecision(false);
    }
  };

  const handleConfirmDecline = async () => {
    if (!currentQuotation) return;
    setProcessingDecision(true);
    try {
      await api.declineQuotation(currentQuotation.id, declineReason);
      setShowDeclineModal(false);
      await fetchCaseDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to decline quotation.');
    } finally {
      setProcessingDecision(false);
    }
  };

  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.modifyCustomerCase(modifyData);
      setShowModifyModal(false);
      await fetchCaseDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to update request.');
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.cancelCustomerCase(cancelReason);
      setShowCancelModal(false);
      await fetchCaseDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel inquiry.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-nordic border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-sm font-medium text-slate-700">Loading verified case...</div>
        </div>
      </div>
    );
  }

  if (errorMsg || !caseData) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Case Access Expired</h2>
          <p className="text-xs text-slate-600 mt-2 mb-6">
            {errorMsg || 'Your verified access token has expired or is invalid.'}
          </p>
          <Link
            to="/find-case"
            className="inline-block px-5 py-2.5 rounded-lg bg-brand-nordic text-white text-xs font-semibold hover:bg-brand-nordicDark transition"
          >
            Re-verify Case Reference
          </Link>
        </div>
      </div>
    );
  }

  const canModify = ['NEW', 'MORE_INFO_NEEDED'].includes(caseData.status);
  const canCancel = !['CLOSED', 'REQUEST_DECLINED', 'QUOTATION_ACCEPTED'].includes(caseData.status);

  return (
    <div className="min-h-screen bg-surface-bg pb-16">
      {/* Top Session Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 font-bold text-brand-nordic text-sm sm:text-base">
              <span>BETONGPORTALEN</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded">
                {caseData.caseNumber}
              </span>
              <StatusBadge status={caseData.status} size="sm" />
            </div>
          </div>

          <button
            onClick={handleEndSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Status Explanation Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 mt-0.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-semibold text-slate-500">Current Status</span>
                <StatusBadge status={caseData.status} />
              </div>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {caseData.statusDescription || caseData.status}
              </p>
              {caseData.declineReason && (
                <div className="mt-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-md">
                  <strong>Reason from staff:</strong> {caseData.declineReason}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {canModify && (
              <button
                onClick={() => setShowModifyModal(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Modify Request</span>
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Cancel Request</span>
              </button>
            )}
          </div>
        </div>

        {/* Two-Column Grid: Left (Quotation & Overview), Right (Messages) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area (8 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. Commercial Quotation Section */}
            {currentQuotation ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-brand-nordic text-white px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">
                        Commercial Quotation
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-800/80 font-mono">
                        v{currentQuotation.version}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mt-0.5">
                      {currentQuotation.quotationNumber}
                    </h3>
                  </div>

                  <a
                    href={api.downloadCustomerPdfUrl(currentQuotation.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition"
                  >
                    <FileDown className="h-4 w-4" />
                    <span>Download PDF</span>
                  </a>
                </div>

                <div className="p-6">
                  {/* Validity Bar */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-4 border-b border-slate-100">
                    <div>
                      Issued: {new Date(currentQuotation.createdAt).toLocaleDateString('sv-SE')}
                    </div>
                    <div className="font-semibold text-rose-700 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Valid until: {new Date(currentQuotation.validityDate).toLocaleDateString('sv-SE')}</span>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                          <th className="py-2.5">Description</th>
                          <th className="py-2.5 text-right">Qty</th>
                          <th className="py-2.5 text-right">Unit Price</th>
                          <th className="py-2.5 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentQuotation.items.map((item, idx) => (
                          <tr key={idx} className="text-slate-800">
                            <td className="py-3 pr-4 font-medium">{item.description}</td>
                            <td className="py-3 text-right text-slate-600 whitespace-nowrap">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-3 text-right text-slate-600 whitespace-nowrap">
                              {item.unitPrice.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                            </td>
                            <td className="py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                              {item.lineTotal.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Summary */}
                  <div className="mt-6 pt-4 border-t border-slate-200 max-w-xs ml-auto space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal (excl. VAT):</span>
                      <span className="font-medium">
                        {currentQuotation.subtotal.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} SEK
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Moms / VAT ({currentQuotation.vatRate}%):</span>
                      <span className="font-medium">
                        {currentQuotation.vatAmount.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} SEK
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200 bg-emerald-50/60 p-2.5 rounded-md">
                      <span>Total Amount:</span>
                      <span className="text-brand-nordic">
                        {currentQuotation.grandTotal.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} SEK
                      </span>
                    </div>
                  </div>

                  {/* Notes / Terms */}
                  {currentQuotation.notes && (
                    <div className="mt-6 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                      <div className="font-semibold text-slate-900 mb-1">Quotation Notes:</div>
                      {currentQuotation.notes}
                    </div>
                  )}

                  <div className="mt-4 text-[11px] text-slate-500 leading-relaxed">
                    <strong>Delivery Terms:</strong> {currentQuotation.termsAndConditions}
                  </div>

                  {/* Accept / Decline Decision Bar */}
                  {caseData.status === 'QUOTATION_SENT' && (
                    <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        onClick={() => setShowDeclineModal(true)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Decline Quotation
                      </button>
                      <button
                        onClick={() => setShowAcceptModal(true)}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
                      >
                        Accept Quotation
                      </button>
                    </div>
                  )}

                  {caseData.status === 'QUOTATION_ACCEPTED' && (
                    <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3 text-xs text-green-900">
                      <CheckCircle2 className="h-5 w-5 text-green-700 flex-shrink-0" />
                      <div>
                        <strong>Quotation Accepted!</strong> Our scheduling team is locking in production and delivery slots. See messages for updates.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
                <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-slate-900">
                  Quotation in Preparation
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Our specialists are negotiating volume prices with regional concrete plants. As soon as pricing is confirmed, your itemized quotation will be published here.
                </p>
              </div>
            )}

            {/* 2. Project & Request Specifications Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 mb-4 pb-2 border-b border-slate-100">
                Inquiry Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-slate-500 block">Requested Product</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {caseData.caseProducts?.[0]?.productName || 'Ready-mix Concrete'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Quantity & Unit</span>
                  <span className="font-semibold text-slate-800 text-sm">
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
                  <span className="text-slate-500 block">Requested Delivery Date</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {caseData.desiredDeliveryDate
                      ? new Date(caseData.desiredDeliveryDate).toLocaleDateString('sv-SE')
                      : 'Flexible / Earliest available'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Customer Information</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    {caseData.customerType === 'BUSINESS' ? (
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    {caseData.customerName}
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
                    <span className="text-slate-500 block">Comments</span>
                    <span className="text-slate-800 mt-0.5 block">{caseData.comments}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Two-Way Conversation Chat (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[650px] sticky top-20">
              {/* Chat Header */}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">Case Communication</h3>
                </div>
                <span className="text-[11px] text-slate-500">Live with staff</span>
              </div>

              {/* Chat Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                    <MessageSquare className="h-8 w-8 mb-2 stroke-[1.5]" />
                    <p className="text-xs">No messages yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Have questions about your concrete specs or delivery? Send a message below.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isStaff = msg.senderType === 'STAFF';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {isStaff ? 'Betongportalen Team' : 'You'}
                          </span>
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                            isStaff
                              ? 'bg-slate-100 text-slate-900 border border-slate-200'
                              : 'bg-brand-nordic text-white'
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

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message to employee..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={caseData.status === 'CLOSED'}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim() || caseData.status === 'CLOSED'}
                  className="px-3.5 py-2 rounded-lg bg-brand-nordic text-white text-xs font-semibold hover:bg-brand-nordicDark disabled:opacity-50 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL: ACCEPT QUOTATION */}
      <Modal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        title="Confirm Quotation Acceptance"
        subtitle={`Quotation ${currentQuotation?.quotationNumber} • Version ${currentQuotation?.version}`}
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p>
            You are about to accept quotation <strong>{currentQuotation?.quotationNumber} (v{currentQuotation?.version})</strong> for a total amount of <strong>{currentQuotation?.grandTotal.toLocaleString('sv-SE')} SEK</strong> (incl. VAT).
          </p>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
            <strong>What happens next:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-emerald-800">
              <li>Your decision will be recorded with timestamp and version locking.</li>
              <li>Our dispatch team will confirm batch timing with the concrete plant.</li>
              <li>You will receive an order confirmation email.</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setShowAcceptModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAccept}
              disabled={processingDecision}
              className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
            >
              {processingDecision ? 'Processing...' : 'Yes, Accept Quotation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* CONFIRMATION MODAL: DECLINE QUOTATION */}
      <Modal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        title="Decline Quotation"
        subtitle={`Quotation ${currentQuotation?.quotationNumber}`}
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p>
            Please let us know why you are declining this quotation so we can adjust the offer or check other suppliers:
          </p>
          <textarea
            rows={3}
            placeholder="e.g. Price too high, delivery time doesn't match schedule, changed project requirements..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 text-xs"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowDeclineModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Back
            </button>
            <button
              onClick={handleConfirmDecline}
              disabled={processingDecision}
              className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold"
            >
              {processingDecision ? 'Recording...' : 'Confirm Decline'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: MODIFY REQUEST */}
      <Modal
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        title="Modify Inquiry Details"
      >
        <form onSubmit={handleModifySubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Quantity ({caseData.unit})</label>
            <input
              type="number"
              step="0.5"
              value={modifyData.quantity}
              onChange={(e) => setModifyData({ ...modifyData, quantity: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Delivery Address</label>
            <input
              type="text"
              value={modifyData.deliveryAddress}
              onChange={(e) => setModifyData({ ...modifyData, deliveryAddress: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Delivery Requirements</label>
            <input
              type="text"
              value={modifyData.deliveryRequirements}
              onChange={(e) => setModifyData({ ...modifyData, deliveryRequirements: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Comments / Notes</label>
            <textarea
              rows={2}
              value={modifyData.comments}
              onChange={(e) => setModifyData({ ...modifyData, comments: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowModifyModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-brand-nordic text-white font-semibold hover:bg-brand-nordicDark"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CANCEL REQUEST */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Inquiry"
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to cancel this inquiry? Our employees will cease negotiations with concrete plants for this case.
          </p>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Reason for Cancellation</label>
            <input
              type="text"
              placeholder="e.g. Project postponed or found alternative"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Keep Inquiry
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold"
            >
              Confirm Cancellation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

