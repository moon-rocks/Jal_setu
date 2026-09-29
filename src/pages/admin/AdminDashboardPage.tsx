import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { KpiCard } from '../../components/common/KpiCard';
import { MapContainer } from '../../components/common/MapContainer';
import { ErrorState, LoadingState } from '../../components/ui/LoadingState';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import {
  FileText,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Filter,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  BarChart2,
  PieChart,
  Megaphone,
} from 'lucide-react';
import { analyticsService, DashboardAnalytics } from '../../services/analyticsService';
import { reportService } from '../../services/reportService';
import { auditService } from '../../services/auditService';
import { useRealtimeSubscription } from '../../hooks/useRealtime';
import { ReportItem } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<DashboardAnalytics | null>(null);
  const [recentReports, setRecentReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [m, rep] = await Promise.all([
        analyticsService.getDashboardMetrics(),
        reportService.getReports({ limit: 5 }),
      ]);
      setMetrics(m);
      setRecentReports(rep);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useRealtimeSubscription('reports', () => {
    fetchDashboardData();
  });

  const [selectedPendingReportId, setSelectedPendingReportId] = useState<string | null>(null);

  const pendingReportsFromDb = recentReports.filter(
    (r) => r.status === 'submitted' || r.status === 'location_verified' || r.status === 'under_review'
  );

  const activeReportForAi = pendingReportsFromDb.find((report) => report.id === selectedPendingReportId)
    || pendingReportsFromDb[0]
    || null;
  const dailyReports = metrics?.dailyReports || [];
  const maxDailyReports = Math.max(1, ...dailyReports.map((item) => item.count));
  const issueBreakdown = Object.entries(metrics?.issueBreakdown || {}).sort((a, b) => b[1] - a[1]);

  const handleApproveReport = async (reportId: string) => {
    await reportService.updateReportStatus(reportId, 'location_verified');
    await auditService.logAction('APPROVE_AI_REPORT', 'REPORT', reportId);
    fetchDashboardData();
  };

  const handleRejectReport = async (reportId: string) => {
    await reportService.updateReportStatus(reportId, 'rejected');
    await auditService.logAction('REJECT_REPORT', 'REPORT', reportId);
    fetchDashboardData();
  };

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {errorMessage && <ErrorState message={errorMessage} onRetry={() => void fetchDashboardData()} />}
      {/* Top Banner & Title Area matching Reference 1 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome Back, Admin 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor, Manage and Resolve Water Issues for a Better Muzaffarpur.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Inspirational calligraphy motto pill */}
          <div className="hidden xl:flex items-center px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 text-xs font-bold text-sky-900">
            <span>Manage Today, Save Every Drop for Tomorrow.</span>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards matching Reference 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Reports"
          value={metrics ? String(metrics.totalReports) : undefined}
          isStageZeroPlaceholder={false}
          trendDirection="up"
          icon={<FileText className="w-6 h-6" />}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />

        <KpiCard
          title="Under Review"
          value={metrics ? String(metrics.pendingReports) : undefined}
          isStageZeroPlaceholder={false}
          trendDirection="down"
          icon={<Clock className="w-6 h-6" />}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />

        <KpiCard
          title="Team Assigned"
          value={metrics ? String(metrics.assignedReports) : undefined}
          isStageZeroPlaceholder={false}
          trendDirection="up"
          icon={<Users className="w-6 h-6" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />

        <KpiCard
          title="Resolved"
          value={metrics ? String(metrics.resolvedReports) : undefined}
          isStageZeroPlaceholder={false}
          trendDirection="up"
          icon={<CheckCircle2 className="w-6 h-6" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Main Operations Grid: Live Map + Pending Reports + AI Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Reports Map (Muzaffarpur) (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Live Reports Map</span>
              <span className="text-slate-400 font-normal text-xs">(Muzaffarpur)</span>
            </h3>

            <div className="flex items-center gap-2">
              <select className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 cursor-pointer focus:outline-none">
                <option>All Issues</option>
                <option>Pipeline Leakage</option>
                <option>Dirty Water</option>
                <option>Low Pressure</option>
              </select>
              <select className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 cursor-pointer focus:outline-none">
                <option>This Week</option>
                <option>Today</option>
                <option>This Month</option>
              </select>
            </div>
          </div>

          <MapContainer
            mode="admin"
            title="GIS Ward Jurisdiction"
            subtitle="Muzaffarpur Municipal Hydrology Layer"
            emptyMessage="No reports to display."
            heightClass="h-[360px] sm:h-[400px]"
          />
        </div>

        {/* Center: Pending Reports Queue (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Pending Reports
              </h3>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {pendingReportsFromDb.length}
              </span>
            </div>
            <NavLink
              to="/admin/reports"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
            >
              <span>See All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          {isLoading ? (
            <LoadingState message="Loading pending reports..." />
          ) : pendingReportsFromDb.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-6 h-6 text-slate-400" />}
              title="No reports to review"
              description="Citizen submissions awaiting review will appear here."
              className="p-8 h-[400px] flex flex-col justify-center"
            />
          ) : (
            <div className="space-y-2.5 h-[400px] overflow-y-auto pr-1">
              {pendingReportsFromDb.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedPendingReportId(report.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    activeReportForAi?.id === report.id
                      ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {report.issueTitle}
                    </h4>
                    <PriorityBadge priority={report.priority} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{report.location.ward} · {report.submittedAt}</span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/reports/${report.id}`);
                      }}
                      className="text-[10px] py-1 px-2.5 h-auto rounded-lg"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: AI Verification Panel matching Reference 1 (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                AI
              </span>
              <span>AI Verification</span>
            </h3>
            {activeReportForAi?.aiConfidence != null && (
              <span className="text-[11px] text-slate-400">{activeReportForAi.aiConfidence}% confidence</span>
            )}
          </div>

          {!activeReportForAi ? (
            <EmptyState
              icon={<Sparkles className="w-6 h-6 text-sky-600" />}
              title="No reports awaiting AI review"
              description="New citizen reports will appear here when available."
              className="p-8 h-[400px] flex flex-col justify-center"
            />
          ) : (
            <Card variant="default" padding="sm" className="h-[400px] flex flex-col justify-between overflow-hidden">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] font-semibold text-amber-800">
                Authorized admin review required before accepting this AI recommendation.
              </div>
              <div className="space-y-3">
                {/* Evidence Image Preview */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-16/9 flex items-center justify-center">
                  {activeReportForAi.photoUrl ? (
                    <img src={activeReportForAi.photoUrl} alt="Report evidence" className="w-full h-full object-cover" />
                  ) : (
                    <p className="text-xs text-slate-400">No evidence photo attached</p>
                  )}
                  {activeReportForAi.aiConfidence != null && (
                    <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {activeReportForAi.aiConfidence}% Match
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Detected Issue</span>
                  <h4 className="text-sm font-bold text-slate-900">{activeReportForAi.issueTitle}</h4>

                  {/* Confidence progress bar */}
                  {activeReportForAi.aiConfidence != null && <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${activeReportForAi.aiConfidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {activeReportForAi.aiConfidence}%
                    </span>
                  </div>}
                </div>

                {/* AI Evidence bullet checkmarks */}
                <div className="space-y-1 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800 text-[10px] uppercase block mb-1">
                    Visual Invariant Analysis
                  </span>
                  {activeReportForAi.aiEvidence?.length ? activeReportForAi.aiEvidence.map((ev, i) => (
                    <div key={i} className="flex items-center gap-1.5 truncate">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{ev}</span>
                    </div>
                  )) : <p className="text-slate-400">No AI evidence available for this report.</p>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => void handleApproveReport(activeReportForAi.id)}
                  className="text-xs px-1"
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => void handleRejectReport(activeReportForAi.id)}
                  className="text-xs px-1"
                >
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/reports/${activeReportForAi.id}`)}
                  className="text-xs px-1"
                >
                  Detail
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Analytics & Quick Actions Grid matching Reference 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports Over Time Chart (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Reports Over Time
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">This Month</span>
          </div>

          <Card variant="default" padding="md" className="h-[200px] flex flex-col justify-center text-center">
            {isLoading ? <LoadingState message="Loading report activity..." /> : errorMessage ? null : !metrics?.totalReports ? (
              <p className="text-xs text-slate-400 font-medium">Analytics will appear once reports are available.</p>
            ) : (
              <div className="flex items-end justify-between h-32 gap-1.5 px-2 pt-4">
                {dailyReports.map((item) => (
                  <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-sky-500 rounded-t-md hover:bg-sky-600 transition-colors"
                      style={{ height: `${(item.count / maxDailyReports) * 100}%` }}
                    />
                    <span className="text-[9px] text-slate-400 font-mono">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Issues by Type (3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Issues by Type
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">Distribution</span>
          </div>

          <Card variant="default" padding="md" className="h-[200px] flex flex-col justify-center text-center">
            {isLoading ? <LoadingState message="Loading issue breakdown..." /> : errorMessage ? null : issueBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No issue data to display.</p>
            ) : (
              <div className="w-full text-[10px] space-y-1 text-left text-slate-600">
                {issueBreakdown.slice(0, 5).map(([issue, count]) => (
                  <div key={issue} className="flex justify-between gap-2">
                    <span className="capitalize">{issue.replaceAll('_', ' ')}</span><strong>{count}</strong>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Resolution Rate (2 cols) */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Resolution Rate
            </h4>
          </div>

          <Card variant="default" padding="md" className="h-[200px] flex flex-col items-center justify-center text-center">
            {isLoading ? <LoadingState message="Loading resolution metrics..." /> : errorMessage ? null : !metrics?.totalReports ? (
              <p className="text-xs text-slate-400 font-medium">No report data yet.</p>
            ) : metrics ? (
              <div>
                <p className="text-3xl font-extrabold text-emerald-600 font-mono tabular-nums">{metrics.resolutionRatePct}%</p>
                <p className="text-xs font-bold text-slate-800 mt-1">Resolved</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Avg: {metrics.avgResolutionHours.toFixed(1)} hrs</p>
              </div>
            ) : null}
          </Card>
        </div>

        {/* Quick Actions matching Reference 1 (3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
            Quick Actions
          </h4>

          <div className="grid grid-cols-2 gap-2 h-[200px]">
            <button
              type="button"
              onClick={() => navigate('/admin/reports')}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all flex flex-col items-center justify-center text-center cursor-pointer"
            >
              <FileText className="w-5 h-5 text-sky-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Verify Reports</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/teams')}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all flex flex-col items-center justify-center text-center cursor-pointer"
            >
              <Users className="w-5 h-5 text-blue-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Assign Team</span>
            </button>

            <button
              type="button"
              onClick={() => alert('Publish Municipal Notice modal is active for Stage 0.')}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all flex flex-col items-center justify-center text-center cursor-pointer"
            >
              <Megaphone className="w-5 h-5 text-amber-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">Publish Notice</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/analytics')}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all flex flex-col items-center justify-center text-center cursor-pointer"
            >
              <BarChart2 className="w-5 h-5 text-emerald-600 mb-1.5" />
              <span className="text-xs font-bold text-slate-800">View Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
