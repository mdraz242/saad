import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  Layers,
  Search,
  MessageSquare,
  FileText,
  ChevronDown,
  Building2,
  UserCheck,
  Scale,
  Phone,
  Mail,
  MapPin,
  Check,
} from 'lucide-react';
import { ImageWithFallback, ConcreteIllustration } from '../components/ConcreteVisuals';
import { InquiryForm } from '../components/InquiryForm';

export const HomePage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const location = useLocation();

  // Scroll to hash target on initial load or navigation
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does Betongportalen obtain better prices?',
      a: 'We consolidate demand from thousands of private and commercial projects across Sweden and the Nordic region. Concrete plants prioritize volume and schedule efficiency, enabling us to negotiate wholesale contractor rates that individuals or small builders cannot achieve on single phone calls.',
    },
    {
      q: 'Does it cost anything to submit an inquiry?',
      a: 'No, submitting an inquiry through Betongportalen is 100% free with no obligation to purchase. You receive a full quotation with transparent line items, pump options, and VAT breakdown.',
    },
    {
      q: 'Can you match or beat an existing quote I already received?',
      a: 'Yes! Select "Compare my quote" when creating your request. Simply enter the price, volume, and conditions you were quoted, and our procurement specialists will contact competing local plants to secure an improved offer.',
    },
    {
      q: 'What types of concrete delivery equipment are available?',
      a: 'Depending on your project site accessibility, we can arrange standard chute discharge (up to ~9m), conveyor belt trucks (rännbil / bandbil up to 16m), or dedicated boom pumps (mastpumpar 24m–48m).',
    },
    {
      q: 'How do I follow my request after submitting?',
      a: 'You receive an unpredictable case number (e.g., BP-2026-X8K92P). Whenever you return to Betongportalen, click "Find your case" and verify your identity with a secure single-use email code to chat with our staff, download your quotation PDF, or accept your offer.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 pt-10 pb-16 lg:pt-14 lg:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start lg:items-center">
            {/* Left Column (Text & Value Propositions) */}
            <div className="lg:col-span-5 max-w-xl">
              {/* Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Nordic Concrete & Construction Materials Portal</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                The smarter way to source concrete and construction materials.
              </h1>

              {/* Supporting Text */}
              <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                Tell us what you need. We'll help you find the right product and negotiate the best possible price.
              </p>

              {/* Micro Highlights */}
              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>No endless phone calls</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Verified regional plants</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Compare existing quotes</span>
                </div>
              </div>

              {/* Secondary CTA */}
              <div className="mt-8 flex items-center gap-3">
                <Link
                  to="/find-case"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition"
                >
                  <Search className="h-4 w-4 text-slate-500" />
                  <span>Already have an inquiry? Track your case</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Inquiry Form embedded in Hero */}
            <div className="lg:col-span-7 w-full max-w-xl mx-auto lg:max-w-none">
              <InquiryForm isHero={true} />
            </div>
          </div>
        </div>
      </section>

      {/* Three-Step Process */}
      <section id="how-it-works" className="py-20 lg:py-24 bg-surface-bg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-emerald-700 mb-2">
              Simple Three-Step Process
            </h2>
            <p className="text-3xl font-bold tracking-tight text-slate-900">
              How Betongportalen works
            </p>
            <p className="mt-3 text-sm text-slate-600">
              We streamline the entire journey from your first specification to delivery confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-sm mb-6">
                01
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Specify your requirement
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Choose your concrete grade, semi-dry mix, or kerbstones. Or choose "Compare my quote" to let us negotiate a lower price on an existing offer.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-sm mb-6">
                02
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                We negotiate the best price
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our concrete advisors match your location with regional batching plants, compare schedules, and secure optimal volume rates.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm relative">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-sm mb-6">
                03
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Review & accept online
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track your case securely, chat directly with specialists, download your official quotation PDF, and confirm with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Materials */}
      <section id="materials" className="py-20 lg:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
            <div>
              <h2 className="text-xs uppercase tracking-wider font-semibold text-emerald-700 mb-2">
                Materials Catalogue
              </h2>
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                Supported materials & products
              </p>
            </div>
            <Link
              to="/create-request"
              className="mt-4 md:mt-0 text-sm font-semibold text-brand-nordic hover:text-emerald-700 inline-flex items-center gap-1.5 transition"
            >
              <span>Request custom specification</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Ready-Mix */}
            <div className="rounded-xl border border-slate-200 bg-surface-bg overflow-hidden hover:border-slate-300 hover:shadow-md transition group">
              <div className="aspect-[16/9] w-full overflow-hidden bg-slate-800 relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=600&q=80"
                  alt="Ready-mix concrete pouring"
                  type="readymix"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-slate-800 backdrop-blur-sm shadow-sm">
                  Ready-Mix
                </span>
              </div>
              <div className="p-6">
                <h4 className="text-base font-semibold text-slate-900 mb-1">
                  Ready-Mix Concrete
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  C25/30, C30/37, and C35/45 mixes. Suitable for slabs on ground, basements, garage floors, swimming pools, and foundations.
                </p>
              </div>
            </div>

            {/* Card 2: Semi-Dry */}
            <div className="rounded-xl border border-slate-200 bg-surface-bg overflow-hidden hover:border-slate-300 hover:shadow-md transition group">
              <div className="aspect-[16/9] w-full overflow-hidden bg-stone-900 relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80"
                  alt="Semi-dry earth moist concrete"
                  type="semidry"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-slate-800 backdrop-blur-sm shadow-sm">
                  Semi-Dry / Jordfuktig
                </span>
              </div>
              <div className="p-6">
                <h4 className="text-base font-semibold text-slate-900 mb-1">
                  Semi-Dry Concrete (Jordfuktig)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Earth-moist mix for setting kerbstones, paving slabs, garden edges, and dry-packing structures without formwork collapse.
                </p>
              </div>
            </div>

            {/* Card 3: Kerbstones */}
            <div className="rounded-xl border border-slate-200 bg-surface-bg overflow-hidden hover:border-slate-300 hover:shadow-md transition group">
              <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900 relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80"
                  alt="Concrete kerbstones and pavement"
                  type="kerbstone"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-slate-800 backdrop-blur-sm shadow-sm">
                  Precast
                </span>
              </div>
              <div className="p-6">
                <h4 className="text-base font-semibold text-slate-900 mb-1">
                  Concrete Kerbstones & Precast
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Standard straight and curved kerbstones (Type A, B, T), boundary stones, and modular precast concrete blocks for driveways and roads.
                </p>
              </div>
            </div>

            {/* Card 4: Fibre-Reinforced */}
            <div className="rounded-xl border border-slate-200 bg-surface-bg overflow-hidden hover:border-slate-300 hover:shadow-md transition group">
              <div className="aspect-[16/9] w-full overflow-hidden bg-slate-800 relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80"
                  alt="Fibre-reinforced concrete construction"
                  type="fibre"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-slate-800 backdrop-blur-sm shadow-sm">
                  Reinforced
                </span>
              </div>
              <div className="p-6">
                <h4 className="text-base font-semibold text-slate-900 mb-1">
                  Fibre-Reinforced Concrete
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Steel-fiber or synthetic-fiber reinforced concrete. Eliminates the need for traditional rebar mesh in light slabs and ground surfaces.
                </p>
              </div>
            </div>

            {/* Card 5: Self-Compacting */}
            <div className="rounded-xl border border-slate-200 bg-surface-bg overflow-hidden hover:border-slate-300 hover:shadow-md transition group">
              <div className="aspect-[16/9] w-full overflow-hidden bg-emerald-950 relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=600&q=80"
                  alt="Self-compacting smooth concrete"
                  type="skb"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-slate-800 backdrop-blur-sm shadow-sm">
                  Special Mix
                </span>
              </div>
              <div className="p-6">
                <h4 className="text-base font-semibold text-slate-900 mb-1">
                  Self-Compacting Concrete (SKB)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  High-fluidity, vibration-free concrete that flows under its own weight, ensuring dense consolidation around tight rebar cages.
                </p>
              </div>
            </div>

            {/* Card 6: Aggregates */}
            <div className="rounded-xl border border-slate-200 bg-surface-bg overflow-hidden hover:border-slate-300 hover:shadow-md transition group">
              <div className="aspect-[16/9] w-full overflow-hidden bg-stone-900 relative">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1584463699042-421715694a11?auto=format&fit=crop&w=600&q=80"
                  alt="Crushed rock and stone aggregates"
                  type="aggregate"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-slate-800 backdrop-blur-sm shadow-sm">
                  Aggregates
                </span>
              </div>
              <div className="p-6">
                <h4 className="text-base font-semibold text-slate-900 mb-1">
                  Crushed Rock & Aggregates
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Crushed gravel (0-32 mm bärlager, 0-16 mm, 8-16 mm makadam) for stable ground preparation and base courses beneath concrete castings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Comparison Callout with Visual */}
      <section className="py-16 bg-brand-50 border-b border-brand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 lg:p-12 border border-brand-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
                Feature Highlight
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                Already received a quote elsewhere? Compare it with us.
              </h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Simply fill in your current quoted price and terms without uploading documents. Our procurement team analyzes local capacity to beat or match the quote with superior delivery terms.
              </p>
              <div className="mt-6">
                <Link
                  to="/create-request?compare=true"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-lg bg-brand-nordic text-white hover:bg-brand-nordicDark transition"
                >
                  <span>Compare my quote now</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Comparison Visual Mini-Card */}
            <div className="w-full lg:w-96 rounded-xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-900 relative group aspect-[4/3]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80"
                alt="Contractor on site checking plans"
                type="comparison"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 text-white text-xs pointer-events-none">
                <div className="font-bold text-sm">Transparent Price Comparison</div>
                <div className="text-slate-300 text-[11px] mt-0.5">Average savings: 12% - 22% on batch orders</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-emerald-700 mb-2">
              Why Betongportalen
            </h2>
            <p className="text-3xl font-bold tracking-tight text-slate-900">
              The benefits of sourcing through us
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Concrete is a perishable, logistical product. Sourcing it correctly saves time, money, and on-site stress.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border border-slate-200 bg-surface-bg space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-bold">
                <Check className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">No Phone Calls</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Skip calling multiple supplier plants. Describe your project once and let our procurement team negotiate for you.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-surface-bg space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-bold">
                <Scale className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Wholesale Volume Pricing</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Benefit from our collective purchasing volume. We obtain contractor discounts that single buyers cannot unlock alone.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-surface-bg space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-bold">
                <Truck className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Guaranteed Equipment Match</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                We coordinate boom pumps (mastpumpar), chute trucks, and conveyor belts to ensure concrete reaches your formwork without delays.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-surface-bg space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Written Quotation & Portal</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive clear, itemized quotations with exact Moms/VAT, download official PDFs, and accept or decline with a single click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-surface-bg border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-emerald-700 mb-2">
              Common Questions
            </h2>
            <p className="text-3xl font-bold tracking-tight text-slate-900">
              Frequently asked questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-medium text-slate-900 hover:bg-slate-50 transition"
                >
                  <span className="text-sm font-semibold">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-emerald-700 mb-2">
              Direct Assistance
            </h2>
            <p className="text-3xl font-bold tracking-tight text-slate-900">
              Contact our procurement team
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Need advice on concrete exposure classes, access limits, or special admixtures? We are here to assist.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Phone Card */}
            <div className="p-6 rounded-xl border border-slate-200 bg-surface-bg text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Phone className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Telephone</h4>
              <p className="text-xs text-slate-500">Mon–Fri: 07:00 – 17:00</p>
              <a
                href="tel:+460840012000"
                className="block text-sm font-semibold text-brand-nordic hover:underline"
              >
                +46 (0)8 400 120 00
              </a>
            </div>

            {/* Email Card */}
            <div className="p-6 rounded-xl border border-slate-200 bg-surface-bg text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Mail className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Email Inquiry</h4>
              <p className="text-xs text-slate-500">Average reply: &lt; 2 hours</p>
              <a
                href="mailto:kontakt@betongportalen.se"
                className="block text-sm font-semibold text-brand-nordic hover:underline"
              >
                kontakt@betongportalen.se
              </a>
            </div>

            {/* Office Location */}
            <div className="p-6 rounded-xl border border-slate-200 bg-surface-bg text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <MapPin className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Registered Office</h4>
              <p className="text-xs text-slate-500">Klarabergsviadukten 70</p>
              <span className="block text-xs font-semibold text-slate-800">
                111 64 Stockholm, Sweden
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-surface-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Ready to get the best price on your concrete delivery?
          </h2>
          <p className="mt-3 text-sm text-slate-600 max-w-xl mx-auto">
            Takes less than 3 minutes. Receive an unpredictable case reference and an itemized quotation from regional producers.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/create-request"
              className="w-full sm:w-auto px-7 py-3 text-sm font-semibold rounded-lg bg-brand-nordic text-white hover:bg-brand-nordicDark transition"
            >
              Start 3-step inquiry
            </Link>
            <Link
              to="/find-case"
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition"
            >
              Check existing case
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

