import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState, LoadingState } from '../../components/ui/LoadingState';
import { BarChart3, PieChart, TrendingUp, Clock, MapPin } from 'lucide-react';
import { analyticsService, DashboardAnalytics } from '../../services/analyticsService';
import { useRealtimeSubscription } from '../../hooks/useRealtime';

export const AdminAnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchMetrics = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setMetrics(await analyticsService.getDashboardMetrics());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useRealtimeSubscription('reports', () => {
    fetchMetrics();
  });

  const dailyReports = metrics?.dailyReports || [];
  const maxDailyReports = Math.max(1, ...dailyReports.map((item) => item.count));
  const issueBreakdown = Object.entries(metrics?.issueBreakdown || {}).sort((a, b) => b[1] - a[1]);
  const wardBreakdown = Object.entries(metrics?.wardBreakdown || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto">
      {/* Header */}
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

      {errorMessage && <ErrorState message={errorMessage} onRetry={() => void fetchMetrics()} />}

      {/* Top 2 Analytics Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports Over Time */}
        <Card variant="default" padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>Reports Over Time</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Daily Volume</span>
          </div>

          <div className="h-56 rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-6 text-center bg-slate-50/50">
            {isLoading ? <LoadingState message="Loading report analytics..." /> : errorMessage ? null : metrics?.totalReports === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Analytics will appear once reports are available.</p>
            ) : metrics ? (
              <div className="w-full flex items-end justify-between gap-2 h-40 pt-4">
                {dailyReports.map((item) => (
                  <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-sky-500 rounded-t-md" style={{ height: `${(item.count / maxDailyReports) * 100}%` }} />
                    <span className="text-[10px] text-slate-400 font-mono">{item.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        {/* Issue Types Distribution */}
        <Card variant="default" padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-sky-600" />
              <span>Issue Types Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Category Proportions</span>
          </div>

          <div className="h-56 rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-6 text-center bg-slate-50/50">
            {isLoading ? <LoadingState message="Loading issue breakdown..." /> : errorMessage ? null : issueBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No report categories to display.</p>
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

      {/* Bottom 3 Analytics Containers: Resolution Rate, Average Resolution Time, Ward-wise Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Resolution Rate */}
        <Card variant="default" padding="md" className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Resolution Rate</h3>
          <div className="h-44 rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-4 text-center bg-slate-50/50">
            {isLoading ? <LoadingState message="Loading resolution rate..." /> : errorMessage ? null : !metrics?.totalReports ? (
              <p className="text-xs text-slate-400 font-medium">No reports to calculate a resolution rate.</p>
            ) : metrics ? (
              <div>
                <p className="text-4xl font-extrabold text-emerald-600 font-mono tabular-nums">{metrics.resolutionRatePct}%</p>
                <p className="text-xs font-bold text-slate-700 mt-1">Reports Resolved</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{metrics.resolvedReports} of {metrics.totalReports}</p>
              </div>
            ) : null}
          </div>
        </Card>

        {/* Average Resolution Time */}
        <Card variant="default" padding="md" className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-600" />
            <span>Average Resolution Time</span>
          </h3>
          <div className="h-44 rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-4 text-center bg-slate-50/50">
            {isLoading ? <LoadingState message="Loading resolution times..." /> : errorMessage ? null : !metrics?.resolvedReports ? (
              <p className="text-xs text-slate-400 font-medium">No resolved reports with timing data.</p>
            ) : metrics ? (
              <div>
                <p className="text-4xl font-extrabold text-purple-600 font-mono tabular-nums">{metrics.avgResolutionHours.toFixed(1)} hrs</p>
                <p className="text-xs font-bold text-slate-700 mt-1">Mean Time to Resolve (MTTR)</p>
              </div>
            ) : null}
          </div>
        </Card>

        {/* Ward-wise Reports */}
        <Card variant="default" padding="md" className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-sky-600" />
            <span>Ward-Wise Reports</span>
          </h3>
          <div className="h-44 rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-4 text-center bg-slate-50/50">
            {isLoading ? <LoadingState message="Loading ward reports..." /> : errorMessage ? null : wardBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No ward report data to display.</p>
            ) : (
              <div className="w-full text-xs space-y-1.5 text-left">
                {wardBreakdown.map(([ward, count]) => (
                  <div key={ward} className="flex justify-between gap-3 font-mono">
                    <span>{ward}</span><span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
