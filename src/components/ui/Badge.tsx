import React from 'react';
import { ReportStatus, PriorityLevel } from '../../types';
import { Clock, CheckCircle2, AlertCircle, Wrench, Users, Send } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  ...props
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-sky-50 text-sky-700 border-sky-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 rounded-md border font-medium',
    md: 'text-xs px-2.5 py-1 rounded-md border font-medium',
  };

  return (
    <span className={`inline-flex items-center gap-1 leading-tight ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ReportStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  switch (status) {
    case 'submitted':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          <Send className="w-3.5 h-3.5 text-slate-500" />
          <span>Submitted</span>
        </span>
      );
    case 'location_verified':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
          <span>Location Verified</span>
        </span>
      );
    case 'under_review':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Under Review</span>
        </span>
      );
    case 'team_assigned':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>Team Assigned</span>
        </span>
      );
    case 'repair_in_progress':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}>
          <Wrench className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
          <span>Repair In Progress</span>
        </span>
      );
    case 'resolved':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Resolved</span>
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel; className?: string }> = ({
  priority,
  className = '',
}) => {
  switch (priority) {
    case 'low':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>
          Low Priority
        </span>
      );
    case 'medium':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
          Medium Priority
        </span>
      );
    case 'high':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 ${className}`}>
          <AlertCircle className="w-3 h-3 text-orange-600" />
          High Priority
        </span>
      );
    case 'critical':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Critical
        </span>
      );
  }
};
