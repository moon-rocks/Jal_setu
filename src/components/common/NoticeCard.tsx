import React from 'react';
import { CivicNotice } from '../../types';
import { AlertCircle, Info, CheckCircle2, ChevronRight, Clock, MapPin, AlertTriangle } from 'lucide-react';

export interface NoticeCardProps {
  notice: CivicNotice;
  onClick?: () => void;
}

export const NoticeCard: React.FC<NoticeCardProps> = ({ notice, onClick }) => {
  const severities = {
    warning: {
      bg: 'bg-amber-50/70 border-amber-200/80 hover:border-amber-400 hover:bg-amber-50',
      iconContainer: 'bg-amber-100/90 text-amber-700 group-hover:bg-amber-200/90',
      icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
      badge: 'Maintenance',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300/60',
      titleColor: 'text-amber-950',
      accentBar: 'bg-amber-400',
    },
    critical: {
      bg: 'bg-rose-50/70 border-rose-200/80 hover:border-rose-400 hover:bg-rose-50',
      iconContainer: 'bg-rose-100/90 text-rose-700 group-hover:bg-rose-200/90',
      icon: <AlertCircle className="w-4 h-4 shrink-0" />,
      badge: 'Emergency Alert',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300/60',
      titleColor: 'text-rose-950',
      accentBar: 'bg-rose-500',
    },
    info: {
      bg: 'bg-sky-50/70 border-sky-200/80 hover:border-sky-400 hover:bg-sky-50',
      iconContainer: 'bg-sky-100/90 text-sky-700 group-hover:bg-sky-200/90',
      icon: <Info className="w-4 h-4 shrink-0" />,
      badge: 'Civic Advisory',
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-300/60',
      titleColor: 'text-sky-950',
      accentBar: 'bg-sky-500',
    },
    success: {
      bg: 'bg-emerald-50/70 border-emerald-200/80 hover:border-emerald-400 hover:bg-emerald-50',
      iconContainer: 'bg-emerald-100/90 text-emerald-700 group-hover:bg-emerald-200/90',
      icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
      badge: 'Update Completed',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300/60',
      titleColor: 'text-emerald-950',
      accentBar: 'bg-emerald-500',
    },
  };

  const current = severities[notice.severity] || severities.info;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`group relative overflow-hidden flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${current.bg} ${
        onClick
          ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500'
          : ''
      }`}
    >
      {/* Left indicator accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${current.accentBar}`} />

      <div className={`p-2 rounded-lg ${current.iconContainer} transition-colors shrink-0 mt-0.5`}>
        {current.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border tracking-wide uppercase ${current.badgeClass}`}>
            {current.badge}
          </span>
          {onClick && (
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-all group-hover:translate-x-0.5 shrink-0" />
          )}
        </div>

        <h4 className={`text-xs sm:text-sm font-bold tracking-tight ${current.titleColor} truncate group-hover:underline`}>
          {notice.title}
        </h4>
        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
          {notice.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{notice.timeWindow}</span>
          </span>
          {notice.ward && (
            <span className="flex items-center gap-1 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              <span>{notice.ward}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
