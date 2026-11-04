import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-bg py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-nordic hover:text-emerald-700 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Homepage</span>
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 sm:p-12 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <ShieldCheck className="h-6 w-6 text-emerald-700" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Privacy Notice & GDPR Compliance
              </h1>
              <p className="text-xs text-slate-500">Last updated: October 2026 • Betongportalen AB</p>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Data Controller</h2>
            <p>
              Betongportalen AB (Org nr: 556812-3490), Klarabergsviadukten 70, 111 64 Stockholm, Sweden, is the data controller responsible for the processing of personal data collected through the Betongportalen platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. What Information We Collect</h2>
            <p>
              When you submit an inquiry or use the platform, we collect:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name or company name, business registration number (if business)</li>
              <li>Email address and telephone number</li>
              <li>Project delivery address, dates, and concrete requirements</li>
              <li>Messages exchanged between you and our concrete specialists</li>
              <li>Verification codes and decision records (quotation acceptances / declines)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Purpose and Legal Basis</h2>
            <p>
              Your data is processed strictly for the purpose of identifying suitable concrete producers, negotiating commercial price quotations on your behalf, and coordinating order fulfillment under GDPR Art. 6(1)(b) (performance of a pre-contractual inquiry and contract).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Data Security and Case Access</h2>
            <p>
              Betongportalen implements strict technical access boundaries: customer cases are never public or searchable by third parties. Access requires single-use email verification OTP codes. Customer sessions are short-lived and not stored in permanent browser cookies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">5. Your Rights</h2>
            <p>
              Under GDPR, you have the right to request access to your stored personal data, request rectification of inaccurate records, or request deletion of inquiries once statutory tax and retention periods have lapsed. Contact our data protection officer at <strong>dataskydd@betongportalen.se</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

