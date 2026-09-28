import React from 'react';

interface JalSetuLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  adminBadge?: boolean;
  className?: string;
}

export const JalSetuLogo: React.FC<JalSetuLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showTagline = true,
  adminBadge = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const isLight = variant === 'light';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Water Drop Icon */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="jalWaterGrad" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="jalBridgeGrad" x1="10" y1="60" x2="90" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>
          </defs>

          {/* Water drop outline & fill */}
          <path
            d="M50 8C50 8 18 48 18 68C18 85.673 32.327 96 50 96C67.673 96 82 85.673 82 68C82 48 50 8 50 8Z"
            fill="url(#jalWaterGrad)"
          />

          {/* Inner bridge / wave curve representing Setu (Bridge) over Water */}
          <path
            d="M26 68C36 55 64 55 74 68C70 76 60 82 50 82C40 82 30 76 26 68Z"
            fill="url(#jalBridgeGrad)"
            opacity="0.95"
          />

          {/* Water Ripple Accent */}
          <circle cx="50" cy="46" r="6" fill="#FFFFFF" fillOpacity="0.8" />
          <path
            d="M36 71C43 65 57 65 64 71"
            stroke="#0284C7"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-extrabold tracking-tight ${textSizes[size]} ${
              isLight ? 'text-white' : 'text-slate-900'
            }`}
          >
            Jal<span className="text-sky-500">Setu</span>
          </span>
          {adminBadge && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-500 text-white shadow-xs">
              Admin
            </span>
          )}
        </div>
        {adminBadge && (
          <span className={`text-[11px] font-medium tracking-wide ${isLight ? 'text-sky-200' : 'text-slate-500'}`}>
            Admin Panel
          </span>
        )}
        {showTagline && (
          <span
            className={`text-[11px] font-medium tracking-normal mt-0.5 ${
              isLight ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Har Boond, Behtar Bihar.
          </span>
        )}
      </div>
    </div>
  );
};
