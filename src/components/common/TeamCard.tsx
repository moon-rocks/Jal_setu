import React from 'react';
import { FieldTeam } from '../../types';
import { Users, CheckCircle2, Clock, MapPin, ChevronRight, Radio } from 'lucide-react';
import { Button } from '../ui/Button';

export interface TeamCardProps {
  team: FieldTeam;
  onView?: () => void;
  isSelected?: boolean;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onView,
  isSelected = false,
}) => {
  const getStatusBadge = () => {
    switch (team.status) {
      case 'active':
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {team.status === 'available' ? 'Available' : 'Active'}
          </span>
        );
      case 'on_duty':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            On Duty
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Offline
          </span>
        );
      case 'busy':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Busy
          </span>
        );
    }
  };

  return (
    <div
      className={`group flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border transition-all duration-200 shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-sky-500 ring-2 ring-sky-500/20'
          : 'border-slate-200 hover:border-sky-300'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                {team.name}
              </h4>
              <p className="text-xs text-slate-500">
                {team.vehicleNumber ? `Vehicle: ${team.vehicleNumber}` : 'Rapid Response Unit'}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Team stats */}
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-3">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Members</span>
            <span className="font-bold text-slate-800 font-mono">{team.membersCount} Technicians</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tasks Queue</span>
            <span className="font-bold text-slate-800 font-mono">{team.activeTasksCount} Pending</span>
          </div>
        </div>

        {/* Assigned Wards */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{team.assignedWards.join(', ')}</span>
        </div>

        {/* Current task if active */}
        {team.currentTask ? (
          <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100 text-xs mb-4">
            <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wide block mb-0.5">
              Current Assignment
            </span>
            <p className="font-medium text-slate-800 truncate">{team.currentTask}</p>
            {team.etaMinutes && (
              <p className="text-[11px] text-sky-700 font-mono mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> ETA: ~{team.etaMinutes} mins ({team.distanceKm} km away)
              </p>
            )}
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-400 mb-4">
            No active assignment recorded.
          </div>
        )}
      </div>

      {/* Action */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onView}
        rightIcon={<ChevronRight className="w-4 h-4" />}
        className="w-full justify-between"
      >
        <span>View Team Details</span>
      </Button>
    </div>
  );
};
