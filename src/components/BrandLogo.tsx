import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function BrandLogo({ size = 'md', showText = true }: BrandLogoProps) {
  let containerSize = 'w-12 h-12';
  let crestSize = 'w-10 h-10';
  let titleClass = 'text-sm';
  let subtitleClass = 'text-[9px]';
  let gapClass = 'gap-1';

  if (size === 'sm') {
    containerSize = 'w-8 h-8';
    crestSize = 'w-7 h-7';
    titleClass = 'text-[11px]';
    subtitleClass = 'text-[8px]';
    gapClass = 'gap-0.5';
  } else if (size === 'lg') {
    containerSize = 'w-24 h-24';
    crestSize = 'w-20 h-20';
    titleClass = 'text-xl';
    subtitleClass = 'text-[11px]';
    gapClass = 'gap-2';
  } else if (size === 'xl') {
    containerSize = 'w-36 h-36';
    crestSize = 'w-32 h-32';
    titleClass = 'text-2xl';
    subtitleClass = 'text-xs';
    gapClass = 'gap-3';
  }

  return (
    <div className={`flex flex-col items-center justify-center ${gapClass} text-center select-none`} dir="ltr">
      {/* SVG Crest */}
      <div className={`${containerSize} relative flex items-center justify-center`}>
        {/* Glow behind the logo */}
        <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-md animate-pulse"></div>
        
        <svg 
          viewBox="0 0 100 100" 
          className={`${crestSize} relative z-10 filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.25)]`}
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Rich Metallic Gold Gradient */}
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF0B3" />
              <stop offset="30%" stopColor="#E6C15C" />
              <stop offset="60%" stopColor="#C5A059" />
              <stop offset="100%" stopColor="#8A6E35" />
            </linearGradient>

            {/* Bright Metallic Silver/Platinum Gradient */}
            <linearGradient id="silverGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9CA3AF" />
              <stop offset="30%" stopColor="#E5E7EB" />
              <stop offset="70%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#9CA3AF" />
            </linearGradient>

            {/* Dark Backdrop (optional subtle dark circle) */}
            <radialGradient id="darkBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1C1C1A" />
              <stop offset="100%" stopColor="#0B0B0A" />
            </radialGradient>
          </defs>

          {/* Thin Circular Gold & Silver Frame */}
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            stroke="url(#goldGradient)" 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            strokeDasharray="260 20"
            className="rotate-[120deg] origin-center"
          />
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            stroke="url(#silverGradient)" 
            strokeWidth="0.8" 
            strokeLinecap="round" 
            strokeDasharray="180 100"
            className="rotate-[310deg] origin-center opacity-85"
          />

          {/* Luxury Metallic Gold letter "S" */}
          <text
            x="36"
            y="65"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize="44"
            fontWeight="bold"
            fill="url(#goldGradient)"
            textAnchor="middle"
            className="select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
          >
            S
          </text>

          {/* Luxury Metallic Silver letter "N" interlocking */}
          <text
            x="64"
            y="63"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize="41"
            fontWeight="bold"
            fill="url(#silverGradient)"
            textAnchor="middle"
            className="select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
          >
            N
          </text>
        </svg>
      </div>

      {/* Brand Text labels */}
      {showText && (
        <div className="flex flex-col items-center">
          <span 
            className={`font-serif tracking-[0.3em] font-bold text-white uppercase ${titleClass} drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}
          >
            SNNS
          </span>
          <span 
            className={`font-sans tracking-[0.15em] font-extrabold text-[#C5A059] uppercase ${subtitleClass} mt-0.5`}
          >
            — SNNS.PRO —
          </span>
        </div>
      )}
    </div>
  );
}
