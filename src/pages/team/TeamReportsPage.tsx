import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  FileCheck2,
  Search,
  Filter,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teamMemberService } from '../../services/teamMemberService';
import { AssignedReportItem, WorkStatus } from '../../types/teamMember';

export const TeamReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, teamMemberProfile } = useAuth();
  const memberId = teamMemberProfile?.id || user?.id || '';

  const [reports, setReports] = useState<AssignedReportItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'in_progress' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true);
      const data = await teamMemberService.getAssignedReports(memberId);
      setReports(data);
      setIsLoading(false);
    }
    loadReports();
  }, [memberId]);

  // Tab filter mapping
  const filteredReports = reports.filter((r) => {
    // Tab match
    if (activeTab === 'pending' && r.status !== 'assigned') return false;
    if (activeTab === 'accepted' && r.status !== 'accepted') return false;
    if (activeTab === 'in_progress' && r.status !== 'in_progress') return false;
    if (activeTab === 'completed' && r.status !== 'completed' && r.status !== 'admin_verified') return false;

    // Priority filter
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && r.issueType !== categoryFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.title.toLowerCase().includes(q) ||
        r.reportNumber.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.location.address?.toLowerCase().includes(q) ||
        r.location.ward.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

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

  const getStatusBadge = (s: WorkStatus) => {
    switch (s) {
      case 'assigned':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Pending Acceptance
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
            Completed (Under Review)
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
    <div className="space-y-6 select-none font-sans text-left">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Assigned Field Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Water problem reports assigned specifically to your account for field action.
          </p>
        </div>

        {/* Quick Link to Map */}
        <button
          type="button"
          onClick={() => navigate('/team/map')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center gap-2 border border-slate-700 cursor-pointer self-start sm:self-auto"
        >
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>Switch to Field Map View</span>
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'all', label: 'All Tasks', count: reports.length },
          { id: 'pending', label: 'Pending', count: reports.filter((r) => r.status === 'assigned').length },
          { id: 'accepted', label: 'Accepted', count: reports.filter((r) => r.status === 'accepted').length },
          { id: 'in_progress', label: 'In Progress', count: reports.filter((r) => r.status === 'in_progress').length },
          { id: 'completed', label: 'Completed', count: reports.filter((r) => r.status === 'completed' || r.status === 'admin_verified').length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-[#0E1A30] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === tab.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* SEARCH AND SECONDARY FILTERS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#0E1A30] border border-slate-800">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search report ID, title, street or ward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#081224] text-white text-xs rounded-xl border border-slate-700 py-2.5 pl-9 pr-3 focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 shrink-0">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full bg-[#081224] text-white text-xs rounded-xl border border-slate-700 py-2.5 px-3 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 shrink-0">Issue:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#081224] text-white text-xs rounded-xl border border-slate-700 py-2.5 px-3 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="pipeline_leakage">Pipeline Leakage</option>
            <option value="dirty_water">Dirty Water</option>
            <option value="no_water">No Supply</option>
            <option value="low_pressure">Low Pressure</option>
            <option value="broken_tap">Broken Tap</option>
          </select>
        </div>
      </div>

      {/* REPORTS LIST */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Loading assigned reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0E1A30] border border-slate-800 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No Reports Matching Criteria</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no tasks matching your selected filters or search keywords.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setPriorityFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="p-5 sm:p-6 rounded-2xl bg-[#0E1A30] border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg text-left"
            >
              {/* Top Row: Report ID, Issue Category, Priority, Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    {report.reportNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {report.issueType.replace('_', ' ')}
                  </span>
                  {getPriorityBadge(report.priority)}
                </div>
                <div>{getStatusBadge(report.status)}</div>
              </div>

              {/* Main Info */}
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {report.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                  {report.description}
                </p>
              </div>

              {/* Work Instructions if present */}
              {report.instructions && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wider block">
                    Dispatch Instructions:
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {report.instructions}
                  </p>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">
                    {report.location.address || `${report.location.ward}, Muzaffarpur`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Reported: {report.citizenReportDate}</span>
                </div>

                {report.deadline && (
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Target: {report.deadline}</span>
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="text-[11px] text-slate-500">
                  Assigned by: <span className="text-slate-400">{report.assignedBy || 'Operations Desk'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/team/map?lat=${report.location.latitude}&lng=${report.location.longitude}`)}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors flex items-center gap-1.5 border border-slate-800 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>View on Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/team/reports/${report.id}`)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
                  >
                    <span>
                      {report.status === 'assigned'
                        ? 'Review & Accept'
                        : report.status === 'accepted'
                        ? 'Start Field Work'
                        : report.status === 'in_progress'
                        ? 'Submit Evidence'
                        : 'Open Details'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
