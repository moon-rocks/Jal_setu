import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../../components/ui/LoadingState';
import { Button } from '../../components/ui/Button';
import { ReportCard } from '../../components/common/ReportCard';
import { ReportItem } from '../../types';
import { FileText, Plus, Search, Filter, X } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useRealtimeSubscription } from '../../hooks/useRealtime';

export const CitizenMyReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchReports = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await reportService.getReports({ citizenOnly: true });
      setReportsList(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load your reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Realtime subscription for report updates
  useRealtimeSubscription('reports', () => {
    fetchReports();
  });

  // Sync with URL query parameter changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const filteredReports = reportsList.filter((report) => {
    // Tab filter
    if (activeTab === 'pending' && report.status !== 'under_review' && report.status !== 'submitted') {
      return false;
    }
    if (activeTab === 'in_progress' && report.status !== 'repair_in_progress' && report.status !== 'team_assigned') {
      return false;
    }
    if (activeTab === 'resolved' && report.status !== 'resolved') {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = report.id.toLowerCase().includes(q);
      const matchTitle = report.issueTitle.toLowerCase().includes(q);
      const matchDesc = report.description?.toLowerCase().includes(q) || false;
      const matchWard = report.location.ward.toLowerCase().includes(q);
      return matchId || matchTitle || matchDesc || matchWard;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            My Water Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track real-time progress and field technician updates for your submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="civic"
            size="sm"
            onClick={() => navigate('/report')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Report Issue
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Interactive Filter Tabs (functional buttons with click handlers) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All Reports' },
              { id: 'pending', label: 'Under Review' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'resolved', label: 'Resolved' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search report ID, issue, ward..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="w-full bg-slate-50 text-slate-800 placeholder:text-slate-400 text-xs rounded-xl pl-8.5 pr-8 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all select-text"
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

      {/* Active Search Query Feedback Bar */}
      {searchQuery && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-sky-50 border border-sky-200/80 text-xs text-sky-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-sky-600" />
            <span>
              Searching for: <strong className="font-bold text-sky-950">&ldquo;{searchQuery}&rdquo;</strong> ({filteredReports.length} results)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchParams({});
            }}
            className="text-xs font-semibold text-sky-700 hover:text-sky-950 underline cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Content Region */}
      {isLoading ? (
        <LoadingState message="Loading your reports..." />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={() => void fetchReports()} />
      ) : reportsList.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-sky-600" />}
          title="No reports yet"
          description="Your submitted water issues will appear here."
          actionLabel="Report a Water Problem"
          onAction={() => navigate('/report')}
          className="my-8"
        />
      ) : filteredReports.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <p className="text-sm font-bold text-slate-800">
            No reports found matching &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or resetting the status filter tab.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveTab('all');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={() => navigate(`/reports/${report.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
