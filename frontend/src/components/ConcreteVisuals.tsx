import React, { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  type?: 'hero' | 'readymix' | 'semidry' | 'kerbstone' | 'fibre' | 'skb' | 'aggregate' | 'comparison';
}

export const ConcreteIllustration: React.FC<{
  type: string;
  className?: string;
}> = ({ type, className = 'w-full h-full' }) => {
  switch (type) {
    case 'hero':
      return (
        <div className={`relative flex items-center justify-center bg-gradient-to-br from-slate-900 via-brand-nordic to-slate-950 p-6 text-white overflow-hidden ${className}`}>
          {/* Subtle architectural grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Construction Scene SVG Graphic */}
          <svg viewBox="0 0 400 260" className="w-full h-full max-h-[300px] z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Concrete foundation slab */}
            <rect x="30" y="190" width="340" height="50" rx="4" fill="#334155" />
            <rect x="35" y="195" width="330" height="20" fill="#475569" opacity="0.6" />
            <line x1="30" y1="215" x2="370" y2="215" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 4" />

            {/* Heavy Concrete Mixer Truck Body */}
            <rect x="60" y="110" width="160" height="70" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <circle cx="95" cy="190" r="18" fill="#0f172a" stroke="#64748b" strokeWidth="4" />
            <circle cx="170" cy="190" r="18" fill="#0f172a" stroke="#64748b" strokeWidth="4" />

            {/* Rotating Drum */}
            <path d="M 80 145 L 140 100 L 190 120 L 150 165 Z" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="2" />
            <path d="M 100 135 L 170 140" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 4" />

            {/* Truck Cab */}
            <path d="M 220 120 L 260 120 L 275 145 L 275 180 L 220 180 Z" fill="#0f172a" stroke="#475569" strokeWidth="2" />
            <rect x="235" y="130" width="28" height="22" rx="2" fill="#38bdf8" fillOpacity="0.3" stroke="#38bdf8" />
            <circle cx="250" cy="190" r="18" fill="#0f172a" stroke="#64748b" strokeWidth="4" />

            {/* Concrete Boom Pump Arm */}
            <path d="M 170 100 L 220 50 L 290 70 L 330 150 L 330 190" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Concrete Pour Stream */}
            <path d="M 330 190 L 330 200" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" strokeDasharray="3 3" />
            <ellipse cx="330" cy="205" rx="25" ry="8" fill="#94a3b8" />

            {/* Nordic Branding Watermark */}
            <text x="75" y="145" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="sans-serif" letterSpacing="1">BETONGPORTALEN</text>
          </svg>
        </div>
      );

    case 'readymix':
      return (
        <div className={`flex items-center justify-center bg-slate-800 p-4 relative ${className}`}>
          <svg viewBox="0 0 200 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="120" fill="#1e293b" />
            {/* Foundation formwork */}
            <rect x="20" y="70" width="160" height="35" fill="#334155" stroke="#475569" />
            <line x1="20" y1="85" x2="180" y2="85" stroke="#94a3b8" strokeDasharray="5 5" />
            {/* Concrete flow */}
            <path d="M 80 20 L 100 20 L 130 75 L 70 75 Z" fill="#64748b" opacity="0.8" />
            <path d="M 85 20 L 120 70" stroke="#22c55e" strokeWidth="2" strokeDasharray="3 3" />
            <ellipse cx="100" cy="85" rx="40" ry="10" fill="#94a3b8" />
            <text x="100" y="102" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="bold" fontFamily="sans-serif">C25/30 – C35/45</text>
          </svg>
        </div>
      );

    case 'semidry':
      return (
        <div className={`flex items-center justify-center bg-amber-950/90 p-4 relative ${className}`}>
          <svg viewBox="0 0 200 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="120" fill="#292524" />
            {/* Compacted Earth/Gravel Base */}
            <rect x="20" y="80" width="160" height="25" fill="#44403c" />
            {/* Semi-dry moist concrete bed */}
            <rect x="30" y="55" width="140" height="25" fill="#78716c" stroke="#a8a29e" strokeDasharray="4 2" />
            {/* Kerbstone laid in concrete */}
            <rect x="50" y="30" width="100" height="28" rx="2" fill="#d6d3d1" stroke="#e7e5e4" strokeWidth="2" />
            <line x1="100" y1="30" x2="100" y2="58" stroke="#a8a29e" strokeWidth="1" />
            <text x="100" y="100" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold" fontFamily="sans-serif">JORDFUKTIG BETONG</text>
          </svg>
        </div>
      );

    case 'kerbstone':
      return (
        <div className={`flex items-center justify-center bg-slate-900 p-4 relative ${className}`}>
          <svg viewBox="0 0 200 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="120" fill="#0f172a" />
            {/* Roadway asphalt */}
            <rect x="10" y="70" width="180" height="40" fill="#1e293b" />
            <line x1="10" y1="90" x2="190" y2="90" stroke="#f8fafc" strokeWidth="2" strokeDasharray="8 6" />
            {/* Kerbstone line */}
            <rect x="20" y="45" width="48" height="25" rx="1" fill="#cbd5e1" stroke="#94a3b8" />
            <rect x="72" y="45" width="48" height="25" rx="1" fill="#e2e8f0" stroke="#94a3b8" />
            <rect x="124" y="45" width="48" height="25" rx="1" fill="#cbd5e1" stroke="#94a3b8" />
            <text x="100" y="28" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="sans-serif">KANTSTEN STANDARD A/B/T</text>
          </svg>
        </div>
      );

    case 'fibre':
      return (
        <div className={`flex items-center justify-center bg-slate-800 p-4 relative ${className}`}>
          <svg viewBox="0 0 200 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="120" fill="#1e293b" />
            {/* Concrete Slab with internal steel fiber matrix */}
            <rect x="25" y="30" width="150" height="60" rx="3" fill="#475569" stroke="#64748b" strokeWidth="2" />
            {/* Fibres scattered in 3D */}
            <line x1="40" y1="45" x2="65" y2="52" stroke="#22c55e" strokeWidth="2" />
            <line x1="80" y1="40" x2="105" y2="48" stroke="#38bdf8" strokeWidth="2" />
            <line x1="125" y1="45" x2="150" y2="38" stroke="#22c55e" strokeWidth="2" />
            <line x1="50" y1="65" x2="72" y2="78" stroke="#38bdf8" strokeWidth="2" />
            <line x1="90" y1="70" x2="115" y2="60" stroke="#22c55e" strokeWidth="2" />
            <line x1="130" y1="68" x2="155" y2="75" stroke="#38bdf8" strokeWidth="2" />
            <text x="100" y="105" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="bold" fontFamily="sans-serif">FIBERBETONG (STÅL/POLY)</text>
          </svg>
        </div>
      );

    case 'skb':
      return (
        <div className={`flex items-center justify-center bg-emerald-950 p-4 relative ${className}`}>
          <svg viewBox="0 0 200 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="120" fill="#064e3b" />
            {/* Rebar grid */}
            <line x1="30" y1="50" x2="170" y2="50" stroke="#047857" strokeWidth="3" />
            <line x1="30" y1="70" x2="170" y2="70" stroke="#047857" strokeWidth="3" />
            <line x1="60" y1="30" x2="60" y2="90" stroke="#047857" strokeWidth="3" />
            <line x1="100" y1="30" x2="100" y2="90" stroke="#047857" strokeWidth="3" />
            <line x1="140" y1="30" x2="140" y2="90" stroke="#047857" strokeWidth="3" />
            {/* Self compacting fluid layer */}
            <rect x="25" y="40" width="150" height="50" rx="3" fill="#10b981" fillOpacity="0.4" stroke="#34d399" strokeWidth="1.5" />
            <text x="100" y="70" textAnchor="middle" fill="#ecfdf5" fontSize="10" fontWeight="bold" fontFamily="sans-serif">SKB VIBRATIONSFRI</text>
          </svg>
        </div>
      );

    case 'aggregate':
      return (
        <div className={`flex items-center justify-center bg-stone-900 p-4 relative ${className}`}>
          <svg viewBox="0 0 200 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="120" fill="#1c1917" />
            {/* Layered aggregates */}
            <rect x="20" y="30" width="160" height="25" fill="#78716c" />
            <rect x="20" y="55" width="160" height="25" fill="#57534e" />
            <rect x="20" y="80" width="160" height="25" fill="#44403c" />
            <text x="100" y="47" textAnchor="middle" fill="#f5f5f4" fontSize="8" fontWeight="bold" fontFamily="sans-serif">MAKADAM 8-16 mm</text>
            <text x="100" y="72" textAnchor="middle" fill="#f5f5f4" fontSize="8" fontWeight="bold" fontFamily="sans-serif">BÄRLAGER 0-32 mm</text>
            <text x="100" y="97" textAnchor="middle" fill="#f5f5f4" fontSize="8" fontWeight="bold" fontFamily="sans-serif">FÖRSTÄRKNINGSLAGER</text>
          </svg>
        </div>
      );

    case 'comparison':
      return (
        <div className={`flex items-center justify-center bg-slate-900 p-4 relative ${className}`}>
          <svg viewBox="0 0 200 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="120" fill="#0f172a" />
            {/* Balance scale */}
            <line x1="100" y1="20" x2="100" y2="90" stroke="#64748b" strokeWidth="4" />
            <line x1="60" y1="90" x2="140" y2="90" stroke="#64748b" strokeWidth="4" />
            <line x1="45" y1="40" x2="155" y2="40" stroke="#22c55e" strokeWidth="3" />
            {/* Left Pan (Higher price) */}
            <rect x="30" y="50" width="35" height="25" rx="3" fill="#e11d48" opacity="0.8" />
            <text x="47" y="66" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">List Price</text>
            {/* Right Pan (Betongportalen price - lower) */}
            <rect x="135" y="55" width="45" height="25" rx="3" fill="#22c55e" />
            <text x="157" y="71" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">-18% Off</text>
          </svg>
        </div>
      );

    default:
      return (
        <div className={`flex items-center justify-center bg-slate-800 text-slate-400 p-4 ${className}`}>
          <span className="text-xs font-semibold">Concrete Portal</span>
        </div>
      );
  }
};

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  type = 'readymix',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <ConcreteIllustration type={type} className={className} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

