import React from 'react';
import { Loader2 } from 'lucide-react';

export const Skeleton: React.FC<{
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}> = ({ className = 'h-4 w-full', rounded = 'md' }) => {
  const roundings = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={`animate-pulse bg-slate-200/70 ${roundings[rounded]} ${className}`}
      aria-hidden="true"
    />
  );
};

export const LoadingState: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = 'Loading water data...', className = '' }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center text-slate-500 gap-3 ${className}`}
    >
      <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Unable to Load Data',
  message = 'An unexpected error occurred while communicating with the service. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-rose-200 bg-rose-50/30 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-base font-bold text-rose-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-rose-700 max-w-sm mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
