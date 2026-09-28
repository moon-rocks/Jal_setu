import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  MapPin,
  ArrowRight,
  HardHat,
  Camera,
  Activity,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Flame,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teamMemberService } from '../../services/teamMemberService';
import { AssignedReportItem, WorkUpdateItem } from '../../types/teamMember';

export const TeamDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, teamMemberProfile } = useAuth();
  const [reports, setReports] = useState<AssignedReportItem[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<WorkUpdateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const memberId = teamMemberProfile?.id || user?.id || '';

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [assigned, updates] = await Promise.all([
        teamMemberService.getAssignedReports(memberId),
        teamMemberService.getRecentWorkUpdates(memberId),
      ]);
      setReports(assigned);
      setRecentUpdates(updates);
      setIsLoading(false);
    }
    loadData();
  }, [memberId]);

  // Metric counts
  const totalAssigned = reports.length;
  const pendingTasks = reports.filter((r) => r.status === 'assigned').length;
  const inProgress = reports.filter((r) => r.status === 'in_progress' || r.status === 'accepted').length;
  const completed = reports.filter((r) => r.status === 'completed' || r.status === 'admin_verified').length;
  const urgentCount = reports.filter((r) => r.priority === 'critical' || r.priority === 'high').length;
  const dueTodayCount = reports.filter((r) => r.deadline && r.deadline.toLowerCase().includes('today')).length;

  const todayReports = reports.filter((r) => r.status !== 'admin_verified');

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Flame className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700 text-slate-300">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'assigned':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Assigned (New)
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            Accepted
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Awaiting Admin Review
          </span>
        );
      case 'admin_verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            Admin Verified
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Top Welcome & Patrol Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0C1B33] via-[#0E2448] to-[#0A162B] p-5 sm:p-6 rounded-2xl border border-slate-800 text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              Field Technician Desk
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Namaste, {teamMemberProfile?.name || 'Field Officer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Unit:{' '}
            <span className="font-semibold text-amber-400">
              {teamMemberProfile?.teamName || 'No team assigned'}
            </span>{' '}
            · Assigned Zone:{' '}
            <span className="font-semibold text-slate-200">
              {teamMemberProfile?.assignedArea || 'No area assigned'}
            </span>
          </p>
        </div>

        {/* Quick Map Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/team/map')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
          >
            <MapPin className="w-4 h-4" />
            <span>Open Field Map</span>
          </button>
        </div>
      </div>

      {/* 6 OVERVIEW METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Assigned Reports */}
        <div className="p-4 rounded-2xl bg-[#0E1A30] border border-slate-800 text-left space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Assigned</span>
            <FileCheck2 className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
            {isLoading ? '--' : totalAssigned}
          </p>
          <p className="text-[10px] text-slate-500">All assigned jobs</p>
        </div>

        {/* Pending Tasks */}
        <div className="p-4 rounded-2xl bg-[#0E1A30] border border-slate-800 text-left space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">
            {isLoading ? '--' : pendingTasks}
          </p>
          <p className="text-[10px] text-slate-500">Requires acceptance</p>
        </div>

        {/* In Progress */}
        <div className="p-4 rounded-2xl bg-[#0E1A30] border border-slate-800 text-left space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>In Progress</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-400">
            {isLoading ? '--' : inProgress}
          </p>
          <p className="text-[10px] text-slate-500">Field work ongoing</p>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-2xl bg-[#0E1A30] border border-slate-800 text-left space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
            {isLoading ? '--' : completed}
          </p>
          <p className="text-[10px] text-slate-500">Repairs completed</p>
        </div>

        {/* Urgent Reports */}
        <div className="p-4 rounded-2xl bg-[#0E1A30] border border-slate-800 text-left space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Urgent</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-400">
            {isLoading ? '--' : urgentCount}
          </p>
          <p className="text-[10px] text-slate-500">High priority leaks</p>
        </div>

        {/* Due Today */}
        <div className="p-4 rounded-2xl bg-[#0E1A30] border border-slate-800 text-left space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Due Today</span>
            <Calendar className="w-4 h-4 text-amber-300" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-300">
            {isLoading ? '--' : dueTodayCount}
          </p>
          <p className="text-[10px] text-slate-500">Today's target</p>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="bg-[#0E1A30] p-4 rounded-2xl border border-slate-800 text-left space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Field Quick Actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/team/reports')}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 transition-colors flex flex-col gap-1.5 cursor-pointer"
          >
            <FileCheck2 className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-bold text-white">View Queue</span>
            <span className="text-[10px] text-slate-500">All assigned reports</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/team/map')}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 transition-colors flex flex-col gap-1.5 cursor-pointer"
          >
            <MapPin className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold text-white">Field Map</span>
            <span className="text-[10px] text-slate-500">GPS task navigation</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/team/evidence')}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 transition-colors flex flex-col gap-1.5 cursor-pointer"
          >
            <Camera className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-white">Upload Photos</span>
            <span className="text-[10px] text-slate-500">Before & After proof</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/team/updates')}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 transition-colors flex flex-col gap-1.5 cursor-pointer"
          >
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold text-white">Log Progress</span>
            <span className="text-[10px] text-slate-500">Field work notes</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/team/completed')}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-left border border-slate-800 transition-colors flex flex-col gap-1.5 cursor-pointer col-span-2 sm:col-span-1"
          >
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-bold text-white">Completed</span>
            <span className="text-[10px] text-slate-500">Awaiting sign-off</span>
          </button>
        </div>
      </div>

      {/* TODAY'S WORK & RECENT ACTIVITY DUAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Work Priority List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Today's Assigned Field Tasks
              </h2>
              <p className="text-xs text-slate-400">
                Prioritized queue dispatched to you by Municipal Operations.
              </p>
            </div>
            <NavLink
              to="/team/reports"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          <div className="space-y-3">
            {todayReports.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0E1A30] border border-slate-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Queue Clear</p>
                <p className="text-xs text-slate-400">No active pending tasks for your unit.</p>
              </div>
            ) : (
              todayReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0E1A30] border border-slate-800 hover:border-slate-700 transition-all text-left space-y-3 shadow-md"
                >
                  {/* Top line: ID, Priority, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        {report.reportNumber}
                      </span>
                      {getPriorityBadge(report.priority)}
                    </div>
                    {getStatusBadge(report.status)}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {report.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                  {/* Location & Deadline */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate max-w-[220px]">{report.location.address || report.location.ward}</span>
                    </div>

                    {report.deadline && (
                      <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Deadline: {report.deadline}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/team/reports/${report.id}`)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>
                        {report.status === 'assigned'
                          ? 'Review & Accept'
                          : report.status === 'accepted'
                          ? 'Start Work'
                          : report.status === 'in_progress'
                          ? 'Submit Evidence'
                          : 'View Details'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Field Activity Timeline */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Recent Activity
            </h2>
            <p className="text-xs text-slate-400">
              Audit timeline of updates & milestones.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1A30] border border-slate-800 space-y-4 text-left">
            {recentUpdates.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No recent activity logged.
              </p>
            ) : (
              recentUpdates.map((update, idx) => (
                <div key={update.id || idx} className="relative flex gap-3 text-xs">
                  {/* Timeline bullet */}
                  <div className="relative flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1" />
                    {idx !== recentUpdates.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-800 my-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        {update.teamMemberName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(update.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {update.message}
                    </p>
                    <span className="inline-block text-[10px] text-amber-400 font-mono">
                      Task: {update.reportId}
                    </span>
                  </div>
                </div>
              ))
            )}

            <div className="pt-2 border-t border-slate-800 text-center">
              <NavLink
                to="/team/updates"
                className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
              >
                View Full Work Log →
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
