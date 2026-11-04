import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, KeyRound, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, Mail } from 'lucide-react';
import { api, customerSession } from '../services/api';

export const FindCasePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<'ENTER_CASE' | 'ENTER_OTP'>('ENTER_CASE');
  const [caseNumber, setCaseNumber] = useState(searchParams.get('caseNumber') || '');
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // If caseNumber was passed in URL, pre-fill it
  useEffect(() => {
    const param = searchParams.get('caseNumber');
    if (param) {
      setCaseNumber(param.toUpperCase());
    }
  }, [searchParams]);

  // Step 1: Request OTP for Case Reference
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNumber.trim()) {
      setErrorMsg('Please enter your case reference number.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const res = await api.requestAccess(caseNumber.trim().toUpperCase());
      setMaskedEmail(res.maskedEmail);
      setInfoMsg(`A single-use 6-digit code has been dispatched to ${res.maskedEmail}.`);
      setStep('ENTER_OTP');
    } catch (err: any) {
      setErrorMsg(err.message || 'No case found with this reference number. Please verify your reference.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.verifyAccess(caseNumber.trim().toUpperCase(), otpCode.trim());
      // Store session token for this in-tab session
      customerSession.setSession(res.token, res.caseNumber);
      navigate('/case');
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code or request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg py-16 sm:py-24 flex items-center">
      <div className="max-w-md w-full mx-auto px-4">
        {/* Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {/* Brand header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Find Your Case
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Secure email-verified access to your quotes, messages, and order status.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
              <Mail className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* STEP 1: ENTER CASE NUMBER */}
          {step === 'ENTER_CASE' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Case Reference Number
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. BP-2026-X89K2P"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic uppercase"
                    autoFocus
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1.5 block">
                  Found in your submission confirmation email.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-nordic text-white text-sm font-semibold hover:bg-brand-nordicDark active:scale-[0.99] disabled:opacity-50 transition"
              >
                {loading ? (
                  <span>Checking reference...</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-slate-100 text-center">
                <Link
                  to="/create-request"
                  className="text-xs text-slate-600 hover:text-slate-900 transition font-medium"
                >
                  Don't have a case yet? <span className="text-brand-nordic underline font-semibold">Create an inquiry</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: ENTER OTP */}
          {step === 'ENTER_OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    6-Digit Verification Code
                  </label>
                  <span className="text-[11px] text-emerald-700 font-medium">Valid 10 mins</span>
                </div>
                <div className="relative">
                  <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-base font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-nordic/20 focus:border-brand-nordic"
                    autoFocus
                  />
                </div>
                {maskedEmail && (
                  <span className="text-[11px] text-slate-500 mt-1.5 block">
                    Check the inbox of <strong>{maskedEmail}</strong>.
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-nordic text-white text-sm font-semibold hover:bg-brand-nordicDark active:scale-[0.99] disabled:opacity-50 transition"
              >
                {loading ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verify & Enter Case</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    setStep('ENTER_CASE');
                    setOtpCode('');
                    setErrorMsg(null);
                  }}
                  className="hover:text-slate-800 underline"
                >
                  Change case number
                </button>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-brand-nordic hover:text-emerald-700 font-medium"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Resend code</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center text-xs text-slate-500 leading-relaxed">
          For security and privacy, Betongportalen does not preserve case sessions permanently on public devices. Every visit requires verification code confirmation.
        </div>
      </div>
    </div>
  );
};

