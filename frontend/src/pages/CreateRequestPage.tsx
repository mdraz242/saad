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

export const CreateRequestPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success State
  const [submittedCase, setSubmittedCase] = useState<{
    caseNumber: string;
    createdAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form State matching screenshots
  const [formData, setFormData] = useState({
    // Step 1: Customer type
    customerType: 'INDIVIDUAL' as 'INDIVIDUAL' | 'BUSINESS',

    // Step 2: Product & day
    productName: '',
    helpMeChoose: false,
    projectDescription: '',
    quantity: '5',
    unit: 'm³',
    desiredDeliveryDate: '',
    deliveryMethod: 'DELIVERY' as 'DELIVERY' | 'PICKUP',

    // Step 3: Contact & review
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-12 text-center max-w-lg w-full">
          <div className="w-16 h-16 bg-[#ede9fe] text-[#1e1b8a] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Check className="h-8 w-8 stroke-[2.5]" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-[#1e1b8a]">
            YOUR FREE INQUIRY
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
            Inquiry registered!
          </h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Thank you, <strong>{formData.customerName}</strong>. We are comparing prices from regional concrete plants to get you the best offer.
          </p>

          <div className="mt-6 p-5 rounded-2xl bg-[#f8f7ff] border border-indigo-100 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Your Unique Case Reference
            </span>
            <div className="flex items-center justify-between gap-4">
              <span className="text-2xl font-mono font-bold text-[#1e1b8a] tracking-wider">
                {submittedCase.caseNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyCaseNumber}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
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
            <p className="text-xs text-slate-500 mt-2 border-t border-slate-200/60 pt-2">
              Confirmation sent to <strong>{formData.customerEmail}</strong>.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/find-case?caseNumber=${submittedCase.caseNumber}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#1e1b8a] text-white text-sm font-semibold hover:bg-[#151263] transition shadow-md"
            >
              <FolderKanban className="h-4 w-4" />
              <span>Track your case</span>
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafc] py-8 sm:py-14 px-4 sm:px-6">
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xs p-6 sm:p-10">
        
        {/* Top Header: Badge + Step Counter */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1e1b8a]">
              YOUR FREE INQUIRY
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              {currentStep === 1 && 'Who orders?'}
              {currentStep === 2 && 'What do you need?'}
              {currentStep === 3 && 'Who will receive the price quote?'}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              {currentStep === 1 && 'Choose what suits you.'}
              {currentStep === 2 && 'Write your product and select the desired day.'}
              {currentStep === 3 && 'A few final tasks, then you\'re done.'}
            </p>
          </div>

          <div className="text-right pl-4 flex-shrink-0">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
              0{currentStep}
            </span>
            <span className="text-xs font-bold text-slate-400 block mt-0.5">/ 03</span>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mt-6 mb-8 border-b border-slate-200">
          <div className="flex items-center gap-6 sm:gap-8 pb-3">
            {/* Step 1 */}
            <div
              onClick={() => currentStep > 1 && setCurrentStep(1)}
              className={`flex items-center gap-2 relative cursor-pointer pb-2 -mb-3 transition ${
                currentStep === 1
                  ? 'border-b-2 border-[#1e1b8a] text-slate-900 font-bold'
                  : currentStep > 1
                  ? 'text-slate-700 hover:text-slate-900 font-medium'
                  : 'text-slate-400 font-medium'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep > 1
                    ? 'bg-slate-300 text-slate-800'
                    : currentStep === 1
                    ? 'bg-slate-300 text-slate-800'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {currentStep > 1 ? <Check className="h-3 w-3 stroke-[3]" /> : '1'}
              </div>
              <span className="text-xs sm:text-sm">Customer type</span>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => currentStep > 2 && setCurrentStep(2)}
              className={`flex items-center gap-2 relative cursor-pointer pb-2 -mb-3 transition ${
                currentStep === 2
                  ? 'border-b-2 border-[#1e1b8a] text-slate-900 font-bold'
                  : currentStep > 2
                  ? 'text-slate-700 hover:text-slate-900 font-medium'
                  : 'text-slate-400 font-medium'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep > 2
                    ? 'bg-slate-300 text-slate-800'
                    : currentStep === 2
                    ? 'bg-slate-300 text-slate-800'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {currentStep > 2 ? <Check className="h-3 w-3 stroke-[3]" /> : '2'}
              </div>
              <span className="text-xs sm:text-sm">Product & day</span>
            </div>

            {/* Step 3 */}
            <div
              className={`flex items-center gap-2 relative pb-2 -mb-3 transition ${
                currentStep === 3
                  ? 'border-b-2 border-[#1e1b8a] text-slate-900 font-bold'
                  : 'text-slate-400 font-medium'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep === 3
                    ? 'bg-slate-300 text-slate-800'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                3
              </div>
              <span className="text-xs sm:text-sm">Contact</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ================= STEP 1: CUSTOMER TYPE ================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Option 1: Private person */}
              <div
                onClick={() => setFormData({ ...formData, customerType: 'INDIVIDUAL' })}
                className={`p-4 sm:p-5 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                  formData.customerType === 'INDIVIDUAL'
                    ? 'border-2 border-[#5046e5] bg-[#f9f8ff] shadow-xs'
                    : 'border border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${
                      formData.customerType === 'INDIVIDUAL'
                        ? 'bg-[#1e1b8a] text-white'
                        : 'bg-[#f0edff] text-[#1e1b8a]'
                    }`}
                  >
                    <User className="h-6 w-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Private person
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                      For your own project
                    </p>
                  </div>
                </div>

                <div>
                  {formData.customerType === 'INDIVIDUAL' ? (
                    <div className="w-6 h-6 rounded-full bg-[#1e1b8a] text-white flex items-center justify-center">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                  )}
                </div>
              </div>

              {/* Option 2: Business */}
              <div
                onClick={() => setFormData({ ...formData, customerType: 'BUSINESS' })}
                className={`p-4 sm:p-5 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                  formData.customerType === 'BUSINESS'
                    ? 'border-2 border-[#5046e5] bg-[#f9f8ff] shadow-xs'
                    : 'border border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${
                      formData.customerType === 'BUSINESS'
                        ? 'bg-[#1e1b8a] text-white'
                        : 'bg-[#f0edff] text-[#1e1b8a]'
                    }`}
                  >
                    <Building2 className="h-6 w-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Business
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                      For the company
                    </p>
                  </div>
                </div>

                <div>
                  {formData.customerType === 'BUSINESS' ? (
                    <div className="w-6 h-6 rounded-full bg-[#1e1b8a] text-white flex items-center justify-center">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 pt-3">
                You will receive a unique case number when you submit your request.
              </p>

              {/* Bottom Navigation */}
              <div className="flex justify-end pt-8">
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-14 h-14 rounded-full bg-[#1e1b8a] hover:bg-[#151263] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  aria-label="Next step"
                >
                  <ArrowRight className="h-6 w-6 stroke-[2.5]" />
                </button>
              </div>

              <p className="text-xs text-slate-400 text-center pt-8">
                Free inquiry. You only order after you have seen the price proposal.
              </p>
            </div>
          )}

          {/* ================= STEP 2: PRODUCT & DAY ================= */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Product input */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  What would you like to order? *
                </label>
                <input
                  type="text"
                  placeholder="For example. Curb S2 or concrete C30/37"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e1b8a] focus:border-[#1e1b8a] transition"
                />
              </div>

              {/* Help me choose banner */}
              <div
                onClick={() => setFormData({ ...formData, helpMeChoose: !formData.helpMeChoose })}
                className="p-3.5 rounded-xl bg-[#f4f1ff] border border-indigo-100 flex items-center gap-3 cursor-pointer select-none transition hover:bg-[#ede9fe]"
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center transition ${
                    formData.helpMeChoose
                      ? 'bg-[#1e1b8a] text-white'
                      : 'border-2 border-slate-400 bg-white'
                  }`}
                >
                  {formData.helpMeChoose && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <span className="font-bold text-[#1e1b8a] text-sm sm:text-base">
                  I don't know – help me choose
                </span>
              </div>

              {/* Conditional project description */}
              {formData.helpMeChoose && (
                <div className="pt-1">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    What are you going to build or cast? *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="For example, I'm going to pour a 30 m² garage slab."
                    value={formData.projectDescription}
                    onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e1b8a] focus:border-[#1e1b8a] transition resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Briefly describe the project and Order will help you find the right product.
                  </p>
                </div>
              )}

              {/* Quantity and Desired day row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. 5 or 2.5"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e1b8a] focus:border-[#1e1b8a] transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Desired day *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.desiredDeliveryDate}
                      onChange={(e) => setFormData({ ...formData, desiredDeliveryDate: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e1b8a] focus:border-[#1e1b8a] transition bg-white"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery method */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Delivery method *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryMethod: 'DELIVERY' })}
                    className={`py-3.5 px-4 rounded-2xl border text-sm flex items-center justify-center gap-2.5 transition ${
                      formData.deliveryMethod === 'DELIVERY'
                        ? 'border-2 border-[#1e1b8a] bg-[#f8f7ff] text-[#1e1b8a] font-bold shadow-xs'
                        : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <Truck className="h-4 w-4 stroke-[2]" />
                    <span>Exit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryMethod: 'PICKUP' })}
                    className={`py-3.5 px-4 rounded-2xl border text-sm flex items-center justify-center gap-2.5 transition ${
                      formData.deliveryMethod === 'PICKUP'
                        ? 'border-2 border-[#1e1b8a] bg-[#f8f7ff] text-[#1e1b8a] font-bold shadow-xs'
                        : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <Package className="h-4 w-4 stroke-[2]" />
                    <span>Download yourself</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Availability and delivery are confirmed in the price quote.
                </p>
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-12 h-12 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5 stroke-[2]" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-14 h-14 rounded-full bg-[#1e1b8a] hover:bg-[#151263] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  aria-label="Next step"
                >
                  <ArrowRight className="h-6 w-6 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: CONTACT & REVIEW ================= */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Your name *
                </label>
                <input
                  type="text"
                  placeholder="First and last name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e1b8a] focus:border-[#1e1b8a] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Email address *
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e1b8a] focus:border-[#1e1b8a] transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-800">
                    Other information
                  </label>
                  <span className="text-xs text-slate-400 font-medium">Optional</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Delivery address, desired time or anything else we need to know..."
                  value={formData.otherInfo}
                  onChange={(e) => setFormData({ ...formData, otherInfo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e1b8a] focus:border-[#1e1b8a] transition resize-none"
                />
              </div>

              {/* Summary box before submission */}
              <div className="border-t border-b border-slate-200 py-4 my-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-slate-700">
                      {formData.deliveryMethod === 'PICKUP' ? (
                        <Package className="h-5 w-5 stroke-[2]" />
                      ) : (
                        <Truck className="h-5 w-5 stroke-[2]" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        Product selection: {formData.productName.trim() || (formData.helpMeChoose ? 'Bespoke advice' : 'flat')}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1.5 font-medium">
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
                    className="text-sm font-semibold text-[#1e1b8a] hover:text-[#151263] underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-12 h-12 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5 stroke-[2]" />
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-8 py-3.5 sm:py-4 rounded-full bg-[#1e1b8a] hover:bg-[#151263] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Sending inquiry...</span>
                  ) : (
                    <>
                      <span>Send inquiry</span>
                      <ArrowRight className="h-5 w-5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-3 text-center sm:text-left">
                You can find the request under My projects with the same email address
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
