import React from 'react';
import { ReportItem } from '../../types';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { WATER_ISSUES } from './IssueCard';

export interface ReportCardProps {
  report: ReportItem;
  onClick?: () => void;
  showDetailsArrow?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onClick,
  showDetailsArrow = true,
}) => {
  const issueMeta = WATER_ISSUES.find((i) => i.id === report.issueType) || WATER_ISSUES[5];
  const Icon = issueMeta.icon;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs transition-all duration-200 hover:shadow-md hover:border-sky-300 ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail or Issue Icon */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 flex items-center justify-center">
          {report.photoUrl ? (
            <img
              src={report.photoUrl}
              alt={report.issueTitle}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className={`p-3 rounded-xl ${issueMeta.iconBg}`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors truncate">
              {report.issueTitle}
            </h4>
            <PriorityBadge priority={report.priority} />
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mb-2.5">
            <span className="inline-flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {report.location.ward}, {report.location.city}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {report.submittedAt}
            </span>
          </div>

          {report.description && (
            <p className="text-xs text-slate-600 line-clamp-1 max-w-xl">
              {report.description}
            </p>
          )}
        </div>
      </div>

      {/* Right status & action */}
      <div className="flex items-center justify-between sm:justify-end gap-3 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <StatusBadge status={report.status} />
        {showDetailsArrow && (
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
        )}
      </div>
    </div>
  );
};
