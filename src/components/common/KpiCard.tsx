import React from 'react';
import { Card } from '../ui/Card';

export interface KpiCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trendText?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  isStageZeroPlaceholder?: boolean;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle = 'vs last week',
  icon,
  iconBg = 'bg-sky-50',
  iconColor = 'text-sky-600',
  trendText,
  trendDirection = 'neutral',
  isStageZeroPlaceholder = true,
  className = '',
}) => {
  return (
    <Card
      variant="default"
      padding="md"
      className={`relative overflow-hidden transition-all duration-200 hover:border-slate-300 ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Metric Value & Title */}
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-slate-500 truncate">
            {title}
          </p>

          <div className="flex items-baseline gap-2 mt-1.5">
            {isStageZeroPlaceholder && (value === undefined || value === null) ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-300 tabular-nums">
                  --
                </span>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  Awaiting DB
                </span>
              </div>
            ) : (
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight tabular-nums">
                {value}
              </span>
            )}

            {trendText && (
              <span
                className={`text-xs font-semibold flex items-center gap-0.5 ${
                  trendDirection === 'up'
                    ? 'text-emerald-600'
                    : trendDirection === 'down'
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {trendDirection === 'up' && '↑'}
                {trendDirection === 'down' && '↓'}
                {trendText}
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {isStageZeroPlaceholder && !value ? 'Connects in Stage 1' : subtitle}
          </p>
        </div>

        {/* Icon Pill */}
        <div
          className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 shadow-xs border border-black/5`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
};
