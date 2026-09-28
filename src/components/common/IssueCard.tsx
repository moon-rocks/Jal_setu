import React from 'react';
import { IssueType } from '../../types';
import { Droplet, Gauge, Wrench, MoreHorizontal, AlertTriangle, ShieldAlert, ArrowUpRight } from 'lucide-react';

export interface IssueCardProps {
  id: IssueType;
  title: string;
  description?: string;
  isSelected?: boolean;
  onClick?: () => void;
  variant?: 'grid' | 'compact' | 'list';
}

export const WATER_ISSUES: {
  id: IssueType;
  title: string;
  description: string;
  icon: React.ElementType;
  bgClass: string;
  textClass: string;
  iconBg: string;
  borderClass: string;
  badge: string;
  badgeClass: string;
}[] = [
  {
    id: 'pipeline_leakage',
    title: 'Pipeline Leakage',
    description: 'Cracked, burst or leaking municipal water pipe',
    icon: ShieldAlert,
    bgClass: 'bg-rose-50/60 hover:bg-rose-50',
    textClass: 'text-rose-700',
    iconBg: 'bg-rose-100 text-rose-600 group-hover:bg-rose-500 group-hover:text-white',
    borderClass: 'border-rose-200/80 hover:border-rose-400 hover:shadow-rose-500/10',
    badge: 'Urgent',
    badgeClass: 'bg-rose-100 text-rose-700 border-rose-200/60',
  },
  {
    id: 'low_pressure',
    title: 'Low Pressure',
    description: 'Weak water flow or insufficient header pressure',
    icon: Gauge,
    bgClass: 'bg-amber-50/60 hover:bg-amber-50',
    textClass: 'text-amber-800',
    iconBg: 'bg-amber-100 text-amber-700 group-hover:bg-amber-500 group-hover:text-white',
    borderClass: 'border-amber-200/80 hover:border-amber-400 hover:shadow-amber-500/10',
    badge: 'Supply',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200/60',
  },
  {
    id: 'dirty_water',
    title: 'Dirty Water',
    description: 'Contaminated, brownish, muddy or foul-smelling water',
    icon: Droplet,
    bgClass: 'bg-orange-50/60 hover:bg-orange-50',
    textClass: 'text-orange-800',
    iconBg: 'bg-orange-100 text-orange-700 group-hover:bg-orange-500 group-hover:text-white',
    borderClass: 'border-orange-200/80 hover:border-orange-400 hover:shadow-orange-500/10',
    badge: 'Health',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200/60',
  },
  {
    id: 'no_water',
    title: 'No Water',
    description: 'Complete outage or stoppage of water supply',
    icon: AlertTriangle,
    bgClass: 'bg-sky-50/60 hover:bg-sky-50',
    textClass: 'text-sky-800',
    iconBg: 'bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white',
    borderClass: 'border-sky-200/80 hover:border-sky-400 hover:shadow-sky-500/10',
    badge: 'Outage',
    badgeClass: 'bg-sky-100 text-sky-700 border-sky-200/60',
  },
  {
    id: 'broken_tap',
    title: 'Broken Tap',
    description: 'Damaged public standpost, valve or municipal tap',
    icon: Wrench,
    bgClass: 'bg-indigo-50/60 hover:bg-indigo-50',
    textClass: 'text-indigo-800',
    iconBg: 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white',
    borderClass: 'border-indigo-200/80 hover:border-indigo-400 hover:shadow-indigo-500/10',
    badge: 'Civic',
    badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200/60',
  },
  {
    id: 'other',
    title: 'Other Issue',
    description: 'Drainage overflow, billing query, or other water problem',
    icon: MoreHorizontal,
    bgClass: 'bg-slate-50/80 hover:bg-slate-100/90',
    textClass: 'text-slate-800',
    iconBg: 'bg-slate-200 text-slate-700 group-hover:bg-slate-700 group-hover:text-white',
    borderClass: 'border-slate-200 hover:border-slate-400 hover:shadow-slate-500/10',
    badge: 'General',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/60',
  },
];

export const IssueCard: React.FC<IssueCardProps> = ({
  id,
  title,
  description,
  isSelected = false,
  onClick,
  variant = 'grid',
}) => {
  const issueMeta = WATER_ISSUES.find((i) => i.id === id) || WATER_ISSUES[5];
  const Icon = issueMeta.icon;

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
          isSelected
            ? 'ring-2 ring-sky-500 border-sky-500 bg-sky-50/60 shadow-xs'
            : `${issueMeta.bgClass} ${issueMeta.borderClass}`
        }`}
      >
        <div className={`p-2 rounded-lg ${issueMeta.iconBg} shrink-0 transition-colors duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 truncate">{title}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col justify-between p-5 sm:p-6 lg:p-7 xl:p-8 rounded-2xl sm:rounded-3xl border text-left transition-all duration-200 cursor-pointer active:scale-[0.98] hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 min-h-[160px] sm:min-h-[185px] lg:min-h-[220px] xl:min-h-[235px] ${
        isSelected
          ? 'ring-2 ring-sky-600 border-sky-600 bg-sky-50/70 shadow-md -translate-y-0.5'
          : `${issueMeta.bgClass} ${issueMeta.borderClass} shadow-2xs`
      }`}
    >
      <div className="space-y-3 lg:space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className={`p-3 sm:p-3.5 lg:p-4 rounded-2xl ${issueMeta.iconBg} transition-all duration-200 group-hover:scale-105 group-hover:rotate-2 shadow-2xs group-hover:shadow-xs shrink-0`}>
            <Icon className="w-6 h-6 sm:w-6.5 sm:h-6.5 lg:w-7.5 lg:h-7.5" />
          </div>

          <div className="flex items-center gap-1.5">
            {issueMeta.badge && (
              <span className={`text-[10px] sm:text-[11px] lg:text-xs font-bold px-2.5 sm:px-3 py-0.5 lg:py-1 rounded-full border tracking-wider uppercase transition-colors ${issueMeta.badgeClass}`}>
                {issueMeta.badge}
              </span>
            )}
            {isSelected && (
              <span className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs lg:text-sm font-bold shadow-xs">
                ✓
              </span>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 group-hover:text-sky-950 tracking-tight transition-colors">
            {title}
          </h4>
          {description && (
            <p className="text-xs sm:text-sm lg:text-sm text-slate-600 mt-1.5 lg:mt-2 leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 lg:mt-6 pt-3 lg:pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs lg:text-sm font-semibold text-slate-500 group-hover:text-sky-700 transition-colors">
        <span>Report issue</span>
        <ArrowUpRight className="w-4 h-4 lg:w-5 lg:h-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sky-600" />
      </div>
    </button>
  );
};
