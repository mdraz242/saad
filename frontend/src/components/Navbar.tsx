import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, ShieldCheck, FolderKanban } from 'lucide-react';
import { customerSession, staffAuthStorage } from '../services/api';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const activeCaseNumber = customerSession.getCaseNumber();
  const isStaffLoggedIn = !!staffAuthStorage.getToken();

  const isNavActive = (path: string) => location.pathname === path;

  // Smooth scroll handler for anchor navigation
  const scrollToSection = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname !== '/') {
      window.location.href = `/#${sectionId}`;
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#${sectionId}`);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-brand-nordic transition group-hover:text-black">
              BETONGPORTALEN
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer transition"
            >
              How it works
            </a>
            <a
              href="#materials"
              onClick={(e) => scrollToSection(e, 'materials')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer transition"
            >
              Supported materials
            </a>
            <a
              href="#benefits"
              onClick={(e) => scrollToSection(e, 'benefits')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer transition"
            >
              Benefits
            </a>
            <a
              href="#contact"
              onClick={(e) => scrollToSection(e, 'contact')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer transition"
            >
              Contact
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-4">
            {activeCaseNumber ? (
              <Link
                to="/case"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
              >
                <FolderKanban className="h-3.5 w-3.5 text-emerald-600" />
                <span>My Case ({activeCaseNumber})</span>
              </Link>
            ) : (
              <Link
                to="/find-case"
                className={`text-sm font-medium transition ${
                  isNavActive('/find-case')
                    ? 'text-brand-nordic font-semibold'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Find your case
              </Link>
            )}

            {isStaffLoggedIn && (
              <Link
                to="/admin/cases"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 transition"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-brand-nordic" />
                <span>Staff Portal</span>
              </Link>
            )}

            <Link
              to="/create-request"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-brand-nordic text-white shadow-sm hover:bg-brand-nordicDark active:scale-[0.99] transition"
            >
              <span>Create a request</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/create-request"
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-brand-nordic text-white"
            >
              Request Quote
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <a
            href="#how-it-works"
            onClick={(e) => scrollToSection(e, 'how-it-works')}
            className="block py-2 text-base font-medium text-slate-700 cursor-pointer"
          >
            How it works
          </a>
          <a
            href="#materials"
            onClick={(e) => scrollToSection(e, 'materials')}
            className="block py-2 text-base font-medium text-slate-700 cursor-pointer"
          >
            Supported materials
          </a>
          <a
            href="#benefits"
            onClick={(e) => scrollToSection(e, 'benefits')}
            className="block py-2 text-base font-medium text-slate-700 cursor-pointer"
          >
            Benefits
          </a>
          <a
            href="#contact"
            onClick={(e) => scrollToSection(e, 'contact')}
            className="block py-2 text-base font-medium text-slate-700 cursor-pointer"
          >
            Contact
          </a>
          <Link
            to="/find-case"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-brand-nordic"
          >
            Find your case
          </Link>
          {activeCaseNumber && (
            <Link
              to="/case"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-emerald-700"
            >
              Active Case: {activeCaseNumber}
            </Link>
          )}
          {isStaffLoggedIn && (
            <Link
              to="/admin/cases"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-slate-800"
            >
              Staff Portal
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

