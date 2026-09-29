import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { ErrorState, LoadingState } from '../../components/ui/LoadingState';
import { BarChart3, PieChart, TrendingUp, Clock, MapPin, Users, Filter } from 'lucide-react';
import { analyticsService, DashboardAnalytics, DashboardFilters } from '../../services/analyticsService';
import { useRealtimeSubscription } from '../../hooks/useRealtime';

const issueChoices = ['all', 'pipeline_leakage', 'low_pressure', 'dirty_water', 'no_water', 'broken_tap', 'other'];

export const AdminAnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filters, setFilters] = useState<DashboardFilters>({ dateRange: '30d', ward: 'all', issueType: 'all' });

  const fetchMetrics = async (nextFilters: DashboardFilters = filters) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setMetrics(await analyticsService.getDashboardMetrics(nextFilters));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchMetrics(filters);
  }, [filters.dateRange, filters.ward, filters.issueType]);

  useRealtimeSubscription('reports', () => {
    void fetchMetrics(filters);
  });

  const dailyReports = metrics?.dailyReports || [];
  const maxDailyReports = Math.max(1, ...dailyReports.map((item) => item.count));
  const issueBreakdown = Object.entries(metrics?.issueBreakdown || {}).sort((a, b) => b[1] - a[1]);
  const wardBreakdown = Object.entries(metrics?.wardBreakdown || {}).sort((a, b) => b[1] - a[1]);
  const wardOptions = useMemo(() => ['all', ...(Object.keys(metrics?.wardBreakdown || {}).sort())], [metrics?.wardBreakdown]);

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-600" />
            <span>Water Infrastructure Analytics</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Statistical distribution, resolution SLA compliance, and ward-level repair efficiency.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
          <Filter className="w-4 h-4 text-sky-600" />
          Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={filters.dateRange || '30d'}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value as DashboardFilters['dateRange'] }))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>

          <select
            value={filters.ward || 'all'}
            onChange={(e) => setFilters((prev) => ({ ...prev, ward: e.target.value }))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
          >
            <option value="all">All wards</option>
            {wardOptions.filter((w) => w !== 'all').map((ward) => (
              <option key={ward} value={ward}>{ward}</option>
            ))}
          </select>

          <select
            value={filters.issueType || 'all'}
            onChange={(e) => setFilters((prev) => ({ ...prev, issueType: e.target.value }))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
          >
            {issueChoices.map((issue) => (
              <option key={issue} value={issue}>{issue === 'all' ? 'All issues' : issue.replaceAll('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage && <ErrorState message={errorMessage} onRetry={() => void fetchMetrics(filters)} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default" padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>Reports Over Time</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Trend</span>
          </div>

          <div className="h-56 rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-6 text-center bg-slate-50/50">
            {isLoading ? <LoadingState message="Loading report analytics..." /> : errorMessage ? null : metrics?.totalReports === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No report activity in the selected window.</p>
            ) : metrics ? (
              <div className="w-full flex items-end justify-between gap-2 h-40 pt-4">
                {dailyReports.map((item) => (
                  <div key={`${item.label}-${Math.random().toString(36).slice(2,7)}`} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-sky-500 rounded-t-md" style={{ height: `${(item.count / maxDailyReports) * 100}%` }} />
                    <span className="text-[10px] text-slate-400 font-mono">{item.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        <Card variant="default" padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-sky-600" />
              <span>Issue Types Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Volume</span>
          </div>

          <div className="h-56 rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-6 text-center bg-slate-50/50">
            {isLoading ? <LoadingState message="Loading issue breakdown..." /> : errorMessage ? null : issueBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No issue data to display.</p>
            ) : (
              <div className="w-full text-xs text-left space-y-2">
                {issueBreakdown.map(([issue, count]) => (
                  <div key={issue} className="flex justify-between gap-4">
                    <span className="capitalize">{issue.replaceAll('_', ' ')}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="default" padding="md" className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Resolution Rate</h3>
          <div className="h-44 rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-4 text-center bg-slate-50/50">
            {isLoading ? <LoadingState message="Loading resolution rate..." /> : errorMessage ? null : !metrics?.totalReports ? (
              <p className="text-xs text-slate-400 font-medium">No reports in scope.</p>
            ) : metrics ? (
              <div>
                <p className="text-4xl font-extrabold text-emerald-600 font-mono tabular-nums">{metrics.resolutionRatePct}%</p>
                <p className="text-xs font-bold text-slate-700 mt-1">Reports Resolved</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{metrics.resolvedReports} of {metrics.totalReports}</p>
              </div>
            ) : null}
          </div>
        </Card>

        <Card variant="default" padding="md" className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-600" />
            <span>Average Resolution Time</span>
          </h3>
          <div className="h-44 rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-4 text-center bg-slate-50/50">
            {isLoading ? <LoadingState message="Loading resolution times..." /> : errorMessage ? null : !metrics?.resolvedReports ? (
              <p className="text-xs text-slate-400 font-medium">No resolved report timings.</p>
            ) : metrics ? (
              <div>
                <p className="text-4xl font-extrabold text-purple-600 font-mono tabular-nums">{metrics.avgResolutionHours.toFixed(1)} hrs</p>
                <p className="text-xs font-bold text-slate-700 mt-1">Mean Time to Resolve</p>
              </div>
            ) : null}
          </div>
        </Card>

        <Card variant="default" padding="md" className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-sky-600" />
            <span>Ward-Wise Reports</span>
          </h3>
          <div className="h-44 rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-4 text-center bg-slate-50/50">
            {isLoading ? <LoadingState message="Loading ward reports..." /> : errorMessage ? null : wardBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No ward data to display.</p>
            ) : (
              <div className="w-full text-xs space-y-1.5 text-left">
                {wardBreakdown.slice(0, 6).map(([ward, count]) => (
                  <div key={ward} className="flex justify-between gap-3 font-mono">
                    <span>{ward}</span><span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card variant="default" padding="md" className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Users className="w-4 h-4 text-sky-600" />
          Team Workload
        </div>
        <div className="space-y-3">
          {isLoading ? (
            <LoadingState message="Loading team workload..." />
          ) : (metrics?.teamWorkload || []).length === 0 ? (
            <p className="text-xs text-slate-400">No active field teams in scope.</p>
          ) : (
            metrics?.teamWorkload.map((team) => (
              <div key={team.teamId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-800">{team.teamName}</span>
                  <span className="text-[10px] text-slate-500">{team.activeReports} active / {team.membersCount} members</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(team.loadScore, 100)}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{team.highPriorityReports} high priority</span>
                  <span>Load {Math.min(team.loadScore, 100)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
