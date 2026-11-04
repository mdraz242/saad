import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                BETONGPORTALEN
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The smarter way to source ready-mix concrete, semi-dry concrete, kerbstones, and construction materials across Scandinavia.
            </p>
            <div className="text-xs text-slate-500 pt-2">
              Betongportalen AB • Org nr: 556812-3490
            </div>
          </div>

          {/* Sourcing */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Materials & Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-400">Ready-mix Concrete (C25/30 – C35/45)</span>
              </li>
              <li>
                <span className="text-slate-400">Semi-dry concrete (Jordfuktig)</span>
              </li>
              <li>
                <span className="text-slate-400">Concrete Kerbstones & Paving</span>
              </li>
              <li>
                <span className="text-slate-400">Fibre-reinforced & Self-compacting</span>
              </li>
              <li>
                <span className="text-slate-400">Crushed rock & Aggregates</span>
              </li>
            </ul>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Portal Access
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/create-request" className="text-slate-300 hover:text-white transition">
                  Create a new request
                </Link>
              </li>
              <li>
                <Link to="/find-case" className="text-slate-300 hover:text-white transition">
                  Find your case (Customer Login)
                </Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="text-slate-300 hover:text-white transition">
                  How inquiry negotiation works
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-white transition">
                  Privacy Policy (GDPR)
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Staff Login */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Contact & Support
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-emerald-400" />
                <span>kontakt@betongportalen.se</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                <span>+46 (0)8 400 120 00</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                <span>Klarabergsviadukten 70, Stockholm</span>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition"
              >
                <Lock className="h-3 w-3" />
                <span>Staff & Administrator Sign In</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Betongportalen AB. All rights reserved.
          </div>
          <div>
            Scandinavian SaaS Quotation Platform • Built for high precision concrete procurement.
          </div>
        </div>
      </div>
    </footer>
  );
};

