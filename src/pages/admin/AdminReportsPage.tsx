import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState, ErrorState } from '../../components/ui/LoadingState';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { ReportItem } from '../../types';
import {
  FileCheck2,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useRealtimeSubscription } from '../../hooks/useRealtime';

export const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';

  const [viewState, setViewState] = useState<'empty' | 'loading' | 'error' | 'normal'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState(qParam);
  const [statusFilter, setStatusFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);

  const fetchReports = async () => {
    setViewState('loading');
    setErrorMessage('');
    try {
      const data = await reportService.getReports();
      setReportsList(data);
      setViewState(data.length > 0 ? 'normal' : 'empty');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load reports.');
      setViewState('error');
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useRealtimeSubscription('reports', () => {
    fetchReports();
  });

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const wards = Array.from(new Set(reportsList.map((report) => report.location.ward).filter(Boolean)));
  const filteredReports = reportsList.filter((report) => {
    if (statusFilter !== 'all' && report.status !== statusFilter) return false;
    if (wardFilter !== 'all' && report.location.ward !== wardFilter) return false;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [report.id, report.issueTitle, report.location.ward, report.location.city, report.description]
      .some((value) => value?.toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Municipal Water Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Incoming citizen reports pending GIS location audit, team allocation, and field dispatch.
          </p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="team_assigned">Team Assigned</option>
            <option value="repair_in_progress">Repair In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={wardFilter}
            onChange={(event) => setWardFilter(event.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Wards</option>
            {wards.map((ward) => <option key={ward} value={ward}>{ward}</option>)}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search report ID, ward, issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 select-text text-slate-800 placeholder:text-slate-400 text-xs rounded-xl pl-8.5 pr-8 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchParams({});
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Filter feedback */}
      {searchQuery && (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
          <span>Filtering reports by: <strong>&ldquo;{searchQuery}&rdquo;</strong></span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchParams({});
            }}
            className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* State Renderers */}
      {viewState === 'loading' && (
        <Card variant="default" padding="lg">
          <LoadingState message="Connecting to municipal GIS reports queue..." />
        </Card>
      )}

      {viewState === 'error' && (
        <ErrorState
          title="Failed to Load Municipal Reports"
          message={errorMessage}
          onRetry={() => void fetchReports()}
        />
      )}

      {viewState === 'empty' && (
        /* STAGE 0 MANDATORY EMPTY STATE */
        <EmptyState
          icon={<FileCheck2 className="w-8 h-8 text-sky-600" />}
          title="No reports to review."
          description="Citizen submissions will appear here once they are received."
          className="my-8"
        />
      )}

      {viewState === 'normal' && (
        /* Normal Table/List */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Issue</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">AI Confidence</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/admin/reports/${report.id}`)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                      {report.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                        {report.issueTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{report.submittedAt}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {report.location.ward}, {report.location.city}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={report.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-slate-800">{report.aiConfidence}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/reports/${report.id}`);
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredReports.length === 0 && (
              <EmptyState
                icon={<FileCheck2 className="w-8 h-8 text-sky-600" />}
                title="No matching reports"
                description="Change or clear the current filters to see other reports."
                className="my-8"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
