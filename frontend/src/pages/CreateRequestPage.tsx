import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Building2,
  User,
  Scale,
  Calendar,
  MapPin,
  ClipboardCheck,
  AlertCircle,
  Copy,
  FolderKanban,
  Send,
  Layers,
} from 'lucide-react';
import { api, customerSession } from '../services/api';
import { Product } from '../types';

export const CreateRequestPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
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
    // Step A
    customerType: 'INDIVIDUAL' as 'INDIVIDUAL' | 'BUSINESS',
    isQuoteComparison: searchParams.get('compare') === 'true',
    selectedProductId: '',
    productName: '',
    customProductText: '',
    existingProduct: '',
    quotedQuantity: '',
    currentQuotedPrice: '',
    terms: '',
    additionalDescription: '',

    // Step B
    quantity: 12,
    unit: 'm³',
    deliveryAddress: '',
    desiredDeliveryDate: '',
    deliveryRequirements: '',
    technicalRequirements: '',
    comments: '',

    // Step C
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    privacyAccepted: false,
  });

  // Fetch admin-managed active products from backend API
  useEffect(() => {
    api
      .getPublicProducts()
      .then((res) => {
        if (res.products && res.products.length > 0) {
          setProducts(res.products);
          // Default to first product if none selected
          setFormData((prev) => ({
            ...prev,
            selectedProductId: res.products[0].id,
            productName: res.products[0].name,
            unit: res.products[0].defaultUnit || 'm³',
          }));
        }
      })
      .catch((err) => console.error('Error fetching products:', err))
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleProductChange = (productId: string) => {
    if (productId === 'custom') {
      setFormData((prev) => ({
        ...prev,
        selectedProductId: 'custom',
        productName: prev.customProductText || 'Custom Concrete / Material',
      }));
    } else {
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        setFormData((prev) => ({
          ...prev,
          selectedProductId: prod.id,
          productName: prod.name,
          unit: prod.defaultUnit || prev.unit,
        }));
      }
    }
  };

  const validateStep1 = () => {
    if (!formData.productName.trim()) {
      setErrorMsg('Please select or specify a concrete product.');
      return false;
    }
    if (formData.isQuoteComparison) {
      if (!formData.currentQuotedPrice.trim()) {
        setErrorMsg('Please specify the current price quoted to you for comparison.');
        return false;
      }
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep2 = () => {
    if (!formData.quantity || formData.quantity <= 0) {
      setErrorMsg('Quantity must be greater than 0.');
      return false;
    }
    if (!formData.deliveryAddress.trim() || formData.deliveryAddress.trim().length < 5) {
      setErrorMsg('Please enter a valid project delivery address (at least 5 characters).');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep3 = () => {
    if (!formData.customerName.trim() || formData.customerName.trim().length < 2) {
      setErrorMsg('Please enter your full name or company name.');
      return false;
    }
    if (!formData.customerEmail.trim() || !formData.customerEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    if (!formData.customerPhone.trim() || formData.customerPhone.trim().length < 6) {
      setErrorMsg('Please enter a valid telephone number.');
      return false;
    }
    if (!formData.privacyAccepted) {
      setErrorMsg('You must accept the privacy policy to submit.');
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
      const payload = {
        customerType: formData.customerType,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        isQuoteComparison: formData.isQuoteComparison,
        existingQuoteDetails: formData.isQuoteComparison
          ? {
              existingProduct: formData.existingProduct || formData.productName,
              quotedQuantity: formData.quotedQuantity || `${formData.quantity} ${formData.unit}`,
              currentQuotedPrice: formData.currentQuotedPrice,
              terms: formData.terms,
              additionalDescription: formData.additionalDescription,
            }
          : undefined,
        productId: formData.selectedProductId === 'custom' ? null : formData.selectedProductId || null,
        productName:
          formData.selectedProductId === 'custom' && formData.customProductText
            ? formData.customProductText
            : formData.productName,
        customRequirements: formData.technicalRequirements,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        deliveryAddress: formData.deliveryAddress,
        desiredDeliveryDate: formData.desiredDeliveryDate ? formData.desiredDeliveryDate : null,
        deliveryRequirements: formData.deliveryRequirements,
        technicalRequirements: formData.technicalRequirements,
        comments: formData.comments,
        privacyAccepted: true,
      };

      const res = await api.submitCase(payload);
      setSubmittedCase({
        caseNumber: res.caseNumber,
        createdAt: res.createdAt,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit request. Please try again.');
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
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8" />
          </div>

          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Request Successfully Submitted
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Thank you, {formData.customerName}!
          </h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            Your inquiry has been registered in our database. Our concrete specialists are already evaluating supplier capacities to negotiate the best price for you.
          </p>

          {/* Unpredictable Case Reference Box */}
          <div className="mt-8 p-6 rounded-lg bg-surface-bg border border-slate-200 inline-block w-full max-w-md text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Your Unique Case Reference
            </span>
            <div className="flex items-center justify-between gap-4">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-brand-nordic tracking-wider">
                {submittedCase.caseNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyCaseNumber}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
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
            <p className="text-xs text-slate-500 mt-3 border-t border-slate-200/80 pt-2">
              We also sent a confirmation email to <strong>{formData.customerEmail}</strong>.
            </p>
          </div>

          {/* Next Steps Guidance */}
          <div className="mt-8 text-left max-w-md mx-auto space-y-3 bg-emerald-50/60 p-4 rounded-lg border border-emerald-100 text-xs text-slate-700">
            <div className="font-semibold text-emerald-900">How to access your case:</div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600">
              <li>Save your case reference: <span className="font-mono font-semibold">{submittedCase.caseNumber}</span></li>
              <li>Go to "Find your case" at any time.</li>
              <li>Enter a temporary 6-digit verification code sent to your email.</li>
              <li>Chat with staff, review itemized quotations, or accept your offer.</li>
            </ol>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/find-case?caseNumber=${submittedCase.caseNumber}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand-nordic text-white text-sm font-semibold hover:bg-brand-nordicDark transition"
            >
              <FolderKanban className="h-4 w-4" />
              <span>Go to Case Verification</span>
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-5 py-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-bg py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Request Quotation
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Create an inquiry
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            No obligation. We source from verified local concrete plants and negotiate the best possible rate.
          </p>
        </div>

        {/* 3-Step Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Step 1 Indicator */}
            <div className="flex items-center gap-2 z-10 bg-surface-bg pr-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  currentStep >= 1
                    ? 'bg-brand-nordic text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                1
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${currentStep >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                Requirement
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-slate-200 mx-2" />

            {/* Step 2 Indicator */}
            <div className="flex items-center gap-2 z-10 bg-surface-bg px-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  currentStep >= 2
                    ? 'bg-brand-nordic text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${currentStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                Project Details
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-slate-200 mx-2" />

            {/* Step 3 Indicator */}
            <div className="flex items-center gap-2 z-10 bg-surface-bg pl-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  currentStep === 3
                    ? 'bg-brand-nordic text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                3
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${currentStep === 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                Contact & Review
              </span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ================= STEP 1: REQUIREMENT ================= */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Customer Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, customerType: 'INDIVIDUAL' })}
                      className={`p-4 rounded-lg border text-left flex items-center gap-3 transition ${
                        formData.customerType === 'INDIVIDUAL'
                          ? 'border-brand-nordic bg-brand-50/50 text-slate-900 ring-1 ring-brand-nordic'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <User className="h-5 w-5 text-slate-600" />
                      <div>
                        <div className="text-sm font-semibold">Individual / Private</div>
                        <div className="text-xs text-slate-500">For home, garage or garden</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, customerType: 'BUSINESS' })}
                      className={`p-4 rounded-lg border text-left flex items-center gap-3 transition ${
                        formData.customerType === 'BUSINESS'
                          ? 'border-brand-nordic bg-brand-50/50 text-slate-900 ring-1 ring-brand-nordic'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <Building2 className="h-5 w-5 text-slate-600" />
                      <div>
                        <div className="text-sm font-semibold">Company / Contractor</div>
                        <div className="text-xs text-slate-500">Commercial & construction</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Compare my quote toggle */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Scale className="h-5 w-5 text-emerald-700" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Compare my quote
                      </div>
                      <div className="text-xs text-slate-500">
                        I already have a price quote and want Betongportalen to beat it.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="compareQuote"
                    checked={formData.isQuoteComparison}
                    onChange={(e) => setFormData({ ...formData, isQuoteComparison: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-nordic focus:ring-brand-nordic"
                  />
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Product / Concrete Type
                  </label>
                  {loadingProducts ? (
                    <div className="text-xs text-slate-500">Loading product list...</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {products.map((p) => {
                        const isSelected = formData.selectedProductId === p.id;
                        // Map product category to image
                        const imgType = p.name.toLowerCase().includes('semi-dry') || p.name.toLowerCase().includes('jordfuktig')
                          ? 'semidry'
                          : p.name.toLowerCase().includes('kerbstone') || p.name.toLowerCase().includes('kantsten')
                          ? 'kerbstone'
                          : p.name.toLowerCase().includes('rock') || p.name.toLowerCase().includes('aggregate') || p.name.toLowerCase().includes('bärlager')
                          ? 'aggregate'
                          : 'readymix';

                        const imgUrl = imgType === 'semidry'
                          ? 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=300&q=80'
                          : imgType === 'kerbstone'
                          ? 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=300&q=80'
                          : imgType === 'aggregate'
                          ? 'https://images.unsplash.com/photo-1584463699042-421715694a11?auto=format&fit=crop&w=300&q=80'
                          : 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=300&q=80';

                        return (
                          <div
                            key={p.id}
                            onClick={() => handleProductChange(p.id)}
                            className={`p-3 rounded-xl border cursor-pointer flex gap-3 items-center transition ${
                              isSelected
                                ? 'border-brand-nordic bg-brand-50/50 ring-1 ring-brand-nordic shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 bg-slate-800">
                              <img
                                src={imgUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to solid brand badge if external CDN blocked
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">
                                {p.description}
                              </div>
                              <span className="text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                                Unit: {p.defaultUnit}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Custom Option Card */}
                      <div
                        onClick={() => handleProductChange('custom')}
                        className={`p-3 rounded-xl border cursor-pointer flex gap-3 items-center transition ${
                          formData.selectedProductId === 'custom'
                            ? 'border-brand-nordic bg-brand-50/50 ring-1 ring-brand-nordic shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                          <Layers className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900">
                            Other / Custom Product
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Specify bespoke concrete grade or precast mix
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom product description if selected */}
                {formData.selectedProductId === 'custom' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Custom Product Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Special marine concrete or fiber mix"
                      value={formData.customProductText}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customProductText: e.target.value,
                          productName: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
                    />
                  </div>
                )}

                {/* Compare Quote Extra Fields (No file upload) */}
                {formData.isQuoteComparison && (
                  <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-4">
                    <div className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
                      Quote Comparison Details
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Current Quoted Price (inc. or excl. VAT) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 34 500 SEK total or 1 450 SEK/m³"
                        value={formData.currentQuotedPrice}
                        onChange={(e) => setFormData({ ...formData, currentQuotedPrice: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Relevant Terms & Delivery Conditions
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 20 min unloading time, pump included, delivery date guaranteed"
                        value={formData.terms}
                        onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Additional Notes on Current Quote
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Any extra info about what was offered..."
                        value={formData.additionalDescription}
                        onChange={(e) => setFormData({ ...formData, additionalDescription: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm bg-white"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-nordic text-white text-sm font-semibold hover:bg-brand-nordicDark transition"
                  >
                    <span>Next: Project Details</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 2: PROJECT DETAILS ================= */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Unit *
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
                    >
                      <option value="m³">m³ (Cubic meters)</option>
                      <option value="tonnes">Tonnes</option>
                      <option value="pieces">Pieces / St</option>
                      <option value="pallets">Pallets</option>
                      <option value="running meters">Running meters (Lpm)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Project / Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Street address, postal code, city (e.g. Storgatan 14, 111 22 Stockholm)"
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Desired Delivery Date
                  </label>
                  <div className="relative">
                    <Calendar className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="date"
                      value={formData.desiredDeliveryDate}
                      onChange={(e) => setFormData({ ...formData, desiredDeliveryDate: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Delivery Requirements
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Concrete pump required, narrow street, weight limit 20t, chute access"
                    value={formData.deliveryRequirements}
                    onChange={(e) => setFormData({ ...formData, deliveryRequirements: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Additional Technical Requirements
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Slump class S4, max stone size 16mm, exposure class XC2"
                    value={formData.technicalRequirements}
                    onChange={(e) => setFormData({ ...formData, technicalRequirements: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Optional Comments
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any other details our advisors should know about your site or project..."
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-nordic text-white text-sm font-semibold hover:bg-brand-nordicDark transition"
                  >
                    <span>Next: Contact & Review</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: CONTACT & REVIEW ================= */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Contact Information
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {formData.customerType === 'BUSINESS' ? 'Company Name / Contact Person *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Anders Svensson or Svensson Bygg AB"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        We send your case reference and secure access codes here.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        placeholder="+46 70 123 45 67"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
                      />
                    </div>
                  </div>
                </div>

                {/* Complete Review Summary */}
                <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    <ClipboardCheck className="h-4 w-4 text-emerald-700" />
                    <span>Inquiry Review Summary</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 border-t border-slate-200 pt-3">
                    <div>
                      <span className="font-semibold text-slate-800">Customer Type: </span>
                      {formData.customerType === 'BUSINESS' ? 'Business' : 'Individual'}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Product: </span>
                      {formData.productName}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Quantity: </span>
                      {formData.quantity} {formData.unit}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Delivery Date: </span>
                      {formData.desiredDeliveryDate || 'Flexible / As soon as possible'}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-semibold text-slate-800">Address: </span>
                      {formData.deliveryAddress}
                    </div>
                    {formData.deliveryRequirements && (
                      <div className="sm:col-span-2">
                        <span className="font-semibold text-slate-800">Delivery Requirements: </span>
                        {formData.deliveryRequirements}
                      </div>
                    )}
                    {formData.isQuoteComparison && (
                      <div className="sm:col-span-2 text-emerald-800 font-medium">
                        Quote Comparison Active • Stated Price: {formData.currentQuotedPrice}
                      </div>
                    )}
                  </div>
                </div>

                {/* Privacy Policy Checkbox */}
                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={formData.privacyAccepted}
                    onChange={(e) => setFormData({ ...formData, privacyAccepted: e.target.checked })}
                    className="h-4 w-4 mt-0.5 rounded border-slate-300 text-brand-nordic focus:ring-brand-nordic"
                  />
                  <label htmlFor="privacy" className="text-xs text-slate-600 leading-normal">
                    I accept the{' '}
                    <Link to="/privacy" target="_blank" className="text-brand-nordic underline font-medium">
                      Privacy Policy (GDPR)
                    </Link>{' '}
                    and consent to Betongportalen storing my inquiry details and contacting me with quotations.
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-brand-nordic text-white text-sm font-semibold hover:bg-brand-nordicDark active:scale-[0.99] disabled:opacity-50 transition shadow-sm"
                  >
                    {submitting ? (
                      <span>Submitting inquiry...</span>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Submit inquiry & get case reference</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

