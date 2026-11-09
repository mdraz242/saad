import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  Truck,
  Package,
  AlertCircle,
  Copy,
  FolderKanban,
} from 'lucide-react';
import { api } from '../services/api';

interface InquiryFormProps {
  className?: string;
  isHero?: boolean;
}

export const InquiryForm: React.FC<InquiryFormProps> = ({ className = '', isHero = false }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success State
  const [submittedCase, setSubmittedCase] = useState<{
    caseNumber: string;
    createdAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customerType: 'INDIVIDUAL' as 'INDIVIDUAL' | 'BUSINESS',
    productName: '',
    helpMeChoose: false,
    projectDescription: '',
    quantity: '5',
    unit: 'm³',
    desiredDeliveryDate: '',
    deliveryMethod: 'DELIVERY' as 'DELIVERY' | 'PICKUP',
    customerName: '',
    customerEmail: '',
    otherInfo: '',
  });

  const validateStep1 = () => {
    setErrorMsg(null);
    return true;
  };

  const validateStep2 = () => {
    if (!formData.productName.trim() && !formData.helpMeChoose) {
      setErrorMsg('Please specify what you would like to order or select "I don\'t know – help me choose".');
      return false;
    }
    if (formData.helpMeChoose && !formData.projectDescription.trim()) {
      setErrorMsg('Please describe what you are going to build or cast.');
      return false;
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setErrorMsg('Please enter a valid quantity.');
      return false;
    }
    if (!formData.desiredDeliveryDate) {
      setErrorMsg('Please select a desired delivery date.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep3 = () => {
    if (!formData.customerName.trim() || formData.customerName.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return false;
    }
    if (!formData.customerEmail.trim() || !formData.customerEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const chosenProduct = formData.productName.trim() || (formData.helpMeChoose ? 'Bespoke recommendation needed' : 'Concrete');
      const payload = {
        customerType: formData.customerType,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim().toLowerCase(),
        customerPhone: 'Not provided',
        productName: chosenProduct,
        customRequirements: formData.helpMeChoose ? formData.projectDescription.trim() : undefined,
        quantity: parseFloat(formData.quantity) || 1,
        unit: formData.unit,
        deliveryAddress: formData.deliveryMethod === 'PICKUP' 
          ? 'Self-pickup / Download yourself' 
          : (formData.otherInfo.trim() || 'Address to be confirmed with quote'),
        desiredDeliveryDate: formData.desiredDeliveryDate || null,
        deliveryRequirements: `Method: ${formData.deliveryMethod === 'PICKUP' ? 'Download yourself (Pickup)' : 'Exit (Delivery to site)'}`,
        technicalRequirements: formData.helpMeChoose ? `Project details: ${formData.projectDescription.trim()}` : undefined,
        comments: formData.otherInfo.trim() || null,
        deliveryMethod: formData.deliveryMethod,
        privacyAccepted: true,
      };

      const res = await api.submitCase(payload);
      setSubmittedCase({
        caseNumber: res.caseNumber,
        createdAt: res.createdAt,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCaseNumber = () => {
    if (submittedCase) {
      navigator.clipboard.writeText(submittedCase.caseNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (submittedCase) {
    return (
      <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 text-center ${className}`}>
        <div className="w-14 h-14 bg-emerald-50 text-brand-nordic rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
          <Check className="h-7 w-7 stroke-[2.5] text-emerald-700" />
        </div>

        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
          YOUR FREE INQUIRY
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Inquiry registered!
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          Thank you, <strong>{formData.customerName}</strong>. We are comparing prices from regional concrete plants to get you the best offer.
        </p>

        <div className="mt-5 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
            Your Unique Case Reference
          </span>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xl sm:text-2xl font-mono font-bold text-brand-nordic tracking-wider">
              {submittedCase.caseNumber}
            </span>
            <button
              type="button"
              onClick={handleCopyCaseNumber}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-600 mt-2 border-t border-emerald-200/60 pt-1.5">
            Confirmation sent to <strong>{formData.customerEmail}</strong>.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={`/find-case?caseNumber=${submittedCase.caseNumber}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-nordic text-white text-xs sm:text-sm font-semibold hover:bg-brand-nordicDark transition shadow-md"
          >
            <FolderKanban className="h-4 w-4" />
            <span>Track your case</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmittedCase(null);
              setCurrentStep(1);
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-full border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            New inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-xl p-5 sm:p-8 text-left relative ${className}`}>
      {/* Top Header: Badge + Step Counter */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
            YOUR FREE INQUIRY
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {currentStep === 1 && 'Who orders?'}
            {currentStep === 2 && 'What do you need?'}
            {currentStep === 3 && 'Who will receive the price quote?'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {currentStep === 1 && 'Choose what suits you.'}
            {currentStep === 2 && 'Write your product and select the desired day.'}
            {currentStep === 3 && 'A few final tasks, then you\'re done.'}
          </p>
        </div>

        <div className="text-right pl-3 flex-shrink-0">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
            0{currentStep}
          </span>
          <span className="text-[11px] font-bold text-slate-400 block mt-0.5">/ 03</span>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="mt-4 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-4 sm:gap-6 pb-2.5">
          {/* Step 1 */}
          <div
            onClick={() => currentStep > 1 && setCurrentStep(1)}
            className={`flex items-center gap-1.5 relative cursor-pointer pb-2 -mb-2.5 transition ${
              currentStep === 1
                ? 'border-b-2 border-brand-nordic text-slate-900 font-bold'
                : currentStep > 1
                ? 'text-slate-700 hover:text-slate-900 font-medium'
                : 'text-slate-400 font-medium'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                currentStep > 1
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentStep === 1
                  ? 'bg-brand-nordic text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 1 ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : '1'}
            </div>
            <span className="text-xs">Customer type</span>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => currentStep > 2 && setCurrentStep(2)}
            className={`flex items-center gap-1.5 relative cursor-pointer pb-2 -mb-2.5 transition ${
              currentStep === 2
                ? 'border-b-2 border-brand-nordic text-slate-900 font-bold'
                : currentStep > 2
                ? 'text-slate-700 hover:text-slate-900 font-medium'
                : 'text-slate-400 font-medium'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                currentStep > 2
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentStep === 2
                  ? 'bg-brand-nordic text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 2 ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : '2'}
            </div>
            <span className="text-xs">Product & day</span>
          </div>

          {/* Step 3 */}
          <div
            className={`flex items-center gap-1.5 relative pb-2 -mb-2.5 transition ${
              currentStep === 3
                ? 'border-b-2 border-brand-nordic text-slate-900 font-bold'
                : 'text-slate-400 font-medium'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                currentStep === 3
                  ? 'bg-brand-nordic text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </div>
            <span className="text-xs">Contact</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ================= STEP 1: CUSTOMER TYPE ================= */}
        {currentStep === 1 && (
          <div className="space-y-3.5">
            {/* Option 1: Private person */}
            <div
              onClick={() => setFormData({ ...formData, customerType: 'INDIVIDUAL' })}
              className={`p-3.5 sm:p-4 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                formData.customerType === 'INDIVIDUAL'
                  ? 'border-2 border-brand-nordic bg-emerald-50/50 shadow-xs'
                  : 'border border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition ${
                    formData.customerType === 'INDIVIDUAL'
                      ? 'bg-brand-nordic text-white'
                      : 'bg-emerald-50 text-brand-nordic'
                  }`}
                >
                  <User className="h-5 w-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Private person
                  </h3>
                  <p className="text-xs text-slate-500">
                    For your own project
                  </p>
                </div>
              </div>

              <div>
                {formData.customerType === 'INDIVIDUAL' ? (
                  <div className="w-5 h-5 rounded-full bg-brand-nordic text-white flex items-center justify-center">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
              </div>
            </div>

            {/* Option 2: Business */}
            <div
              onClick={() => setFormData({ ...formData, customerType: 'BUSINESS' })}
              className={`p-3.5 sm:p-4 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                formData.customerType === 'BUSINESS'
                  ? 'border-2 border-brand-nordic bg-emerald-50/50 shadow-xs'
                  : 'border border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition ${
                    formData.customerType === 'BUSINESS'
                      ? 'bg-brand-nordic text-white'
                      : 'bg-emerald-50 text-brand-nordic'
                  }`}
                >
                  <Building2 className="h-5 w-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Business
                  </h3>
                  <p className="text-xs text-slate-500">
                    For the company
                  </p>
                </div>
              </div>

              <div>
                {formData.customerType === 'BUSINESS' ? (
                  <div className="w-5 h-5 rounded-full bg-brand-nordic text-white flex items-center justify-center">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 pt-2">
              You will receive a unique case number when you submit your request.
            </p>

            {/* Bottom Navigation */}
            <div className="flex justify-end pt-5">
              <button
                type="button"
                onClick={handleNext}
                className="w-12 h-12 rounded-full bg-brand-nordic hover:bg-brand-nordicDark text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                aria-label="Next step"
              >
                <ArrowRight className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center pt-4">
              Free inquiry. You only order after you have seen the price proposal.
            </p>
          </div>
        )}

        {/* ================= STEP 2: PRODUCT & DAY ================= */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Product input */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                What would you like to order? *
              </label>
              <input
                type="text"
                placeholder="For example. Curb S2 or concrete C30/37"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-nordic focus:border-brand-nordic transition"
              />
            </div>

            {/* Help me choose banner */}
            <div
              onClick={() => setFormData({ ...formData, helpMeChoose: !formData.helpMeChoose })}
              className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-2.5 cursor-pointer select-none transition hover:bg-emerald-100/60"
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center transition ${
                  formData.helpMeChoose
                    ? 'bg-brand-nordic text-white'
                    : 'border-2 border-emerald-700/50 bg-white'
                }`}
              >
                {formData.helpMeChoose && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <span className="font-bold text-brand-nordic text-xs sm:text-sm">
                I don't know – help me choose
              </span>
            </div>

            {/* Conditional project description */}
            {formData.helpMeChoose && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  What are you going to build or cast? *
                </label>
                <textarea
                  rows={2}
                  placeholder="For example, I'm going to pour a 30 m² garage slab."
                  value={formData.projectDescription}
                  onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-nordic focus:border-brand-nordic transition resize-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Briefly describe the project and Order will help you find the right product.
                </p>
              </div>
            )}

            {/* Quantity and Desired day row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Quantity *
                </label>
                <input
                  type="text"
                  placeholder="E.g. 5 or 2.5"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-nordic focus:border-brand-nordic transition"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                  Desired day *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.desiredDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, desiredDeliveryDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-nordic focus:border-brand-nordic transition bg-white"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-700">
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery method */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                Delivery method *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryMethod: 'DELIVERY' })}
                  className={`py-3 px-3 rounded-xl border text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                    formData.deliveryMethod === 'DELIVERY'
                      ? 'border-2 border-brand-nordic bg-emerald-50/70 text-brand-nordic font-bold shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 font-medium'
                  }`}
                >
                  <Truck className="h-4 w-4 stroke-[2]" />
                  <span>Exit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryMethod: 'PICKUP' })}
                  className={`py-3 px-3 rounded-xl border text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                    formData.deliveryMethod === 'PICKUP'
                      ? 'border-2 border-brand-nordic bg-emerald-50/70 text-brand-nordic font-bold shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 font-medium'
                  }`}
                >
                  <Package className="h-4 w-4 stroke-[2]" />
                  <span>Download yourself</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Availability and delivery are confirmed in the price quote.
              </p>
            </div>

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="w-11 h-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4 stroke-[2]" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="w-12 h-12 rounded-full bg-brand-nordic hover:bg-brand-nordicDark text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                aria-label="Next step"
              >
                <ArrowRight className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CONTACT & REVIEW ================= */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                Your name *
              </label>
              <input
                type="text"
                placeholder="First and last name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-nordic focus:border-brand-nordic transition"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                Email address *
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-nordic focus:border-brand-nordic transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                  Other information
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Optional</span>
              </div>
              <textarea
                rows={2}
                placeholder="Delivery address, desired time or anything else we need to know..."
                value={formData.otherInfo}
                onChange={(e) => setFormData({ ...formData, otherInfo: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-nordic focus:border-brand-nordic transition resize-none"
              />
            </div>

            {/* Summary box before submission */}
            <div className="border-t border-b border-slate-200 py-3 my-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 text-brand-nordic">
                    {formData.deliveryMethod === 'PICKUP' ? (
                      <Package className="h-4 w-4 stroke-[2]" />
                    ) : (
                      <Truck className="h-4 w-4 stroke-[2]" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      Product selection: {formData.productName.trim() || (formData.helpMeChoose ? 'Bespoke advice' : 'flat')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1 font-medium">
                      <span>{formData.quantity || '1'}</span>
                      <span>·</span>
                      <span>{formData.desiredDeliveryDate || 'Date to be confirmed'}</span>
                      <span>·</span>
                      <span>{formData.deliveryMethod === 'PICKUP' ? 'Download yourself' : 'Exit'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-semibold text-brand-nordic hover:text-brand-nordicDark underline cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleBack}
                className="w-11 h-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4 stroke-[2]" />
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3.5 rounded-full bg-brand-nordic hover:bg-brand-nordicDark text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? (
                  <span>Sending inquiry...</span>
                ) : (
                  <>
                    <span>Send inquiry</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-2 text-center sm:text-left">
              You can find the request under My projects with the same email address
            </p>
          </div>
        )}
      </form>
    </div>
  );
};
