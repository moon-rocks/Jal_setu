import React from 'react';
import { ReportStatus } from '../../types';
import { CheckCircle2, Clock, MapPin, Users, Wrench, ShieldCheck } from 'lucide-react';

export interface ReportTimelineProps {
  currentStatus: ReportStatus;
  className?: string;
  timestamps?: Partial<Record<ReportStatus, string>>;
  completedAt?: string;
}

const STAGES: {
  status: ReportStatus;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    status: 'submitted',
    label: 'Submitted',
    description: 'Issue reported with photo and location evidence',
    icon: Clock,
  },
  {
    status: 'location_verified',
    label: 'Location Verified',
    description: 'GPS accuracy and municipal ward boundary validated',
    icon: MapPin,
  },
  {
    status: 'under_review',
    label: 'Under Review',
    description: 'Municipal desk engineer assessing severity & queue',
    icon: ShieldCheck,
  },
  {
    status: 'team_assigned',
    label: 'Team Assigned',
    description: 'Field response team allocated with equipment',
    icon: Users,
  },
  {
    status: 'repair_in_progress',
    label: 'Repair In Progress',
    description: 'On-site technical repairs being performed',
    icon: Wrench,
  },
  {
    status: 'resolved',
    label: 'Resolved',
    description: 'Issue fixed and verified with post-repair audit',
    icon: CheckCircle2,
  },
];

const STATUS_ORDER: Record<ReportStatus, number> = {
  submitted: 0,
  location_verified: 1,
  under_review: 2,
  team_assigned: 3,
  repair_in_progress: 4,
  resolved: 5,
  rejected: 5,
  duplicate: 5,
};

export const ReportTimeline: React.FC<ReportTimelineProps> = ({
  currentStatus,
  className = '',
  timestamps = {},
  completedAt,
}) => {
  const currentIndex = STATUS_ORDER[currentStatus] ?? 0;
  const workCompletedPendingVerification = currentStatus === 'repair_in_progress' && Boolean(completedAt);
  const completionTime = completedAt
    ? new Date(completedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : undefined;

  return (
    <div className={`py-2 ${className}`}>
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-[15px] sm:before:left-[19px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.status} className="relative flex items-start group">
              {/* Circle Marker */}
              <div
                className={`absolute -left-[27px] sm:-left-[31px] w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-sky-600 text-white ring-4 ring-sky-100 shadow-sm'
                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Stage content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-bold tracking-tight ${
                        isCurrent
                          ? 'text-sky-900'
                          : isCompleted
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {stage.status === 'repair_in_progress' && workCompletedPendingVerification
                        ? 'Field Work Completed'
                        : stage.label}
                    </p>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 animate-pulse">
                        Current Stage
                      </span>
                    )}
                  </div>
                  {(stage.status === 'repair_in_progress' && workCompletedPendingVerification
                    ? completionTime
                    : timestamps[stage.status]) && (
                    <span className="text-xs text-slate-400 font-mono">
                      {stage.status === 'repair_in_progress' && workCompletedPendingVerification
                        ? completionTime
                        : timestamps[stage.status]}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    isPending ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {stage.status === 'repair_in_progress' && workCompletedPendingVerification
                    ? 'Repair completed by the field team and awaiting Admin verification'
                    : stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
