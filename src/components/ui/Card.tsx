import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'elevated' | 'interactive' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = '',
      variant = 'default',
      padding = 'md',
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-white border border-slate-200/80 shadow-xs rounded-2xl',
      subtle: 'bg-slate-50/70 border border-slate-200/60 rounded-2xl',
      elevated: 'bg-white border border-slate-100 shadow-sm shadow-slate-200/40 rounded-2xl',
      interactive:
        'bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 transition-all duration-200 cursor-pointer rounded-2xl active:scale-[0.99]',
      glass:
        'bg-white/80 backdrop-blur-md border border-white/60 shadow-xs rounded-2xl',
    };

    const paddings = {
      none: '',
      sm: 'p-3.5',
      md: 'p-5',
      lg: 'p-6 sm:p-7',
    };

    return (
      <div
        ref={ref}
        className={`${variants[variant]} ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
