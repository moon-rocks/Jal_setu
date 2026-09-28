import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface DashboardAnalytics {
  totalReports: number;
  pendingReports: number;
  assignedReports: number;
  resolvedReports: number;
  highPriorityCount: number;
  activeTeamsCount: number;
  avgResolutionHours: number;
  resolutionRatePct: number;
  issueBreakdown: Record<string, number>;
  wardBreakdown: Record<string, number>;
  dailyReports: { label: string; count: number }[];
}

export const analyticsService = {
  async getDashboardMetrics(): Promise<DashboardAnalytics> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    const [{ data: reports, error: reportsError }, { data: teams, error: teamsError }] = await Promise.all([
      supabase.from('reports').select('status, priority, issue_type, ward_name, created_at, submitted_at, resolved_at'),
      supabase.from('field_teams').select('status'),
    ]);
    if (reportsError) throw reportsError;
    if (teamsError) throw teamsError;

    const reportRows = reports || [];
    const teamRows = teams || [];
    const totalReports = reportRows.length;
    const pendingReports = reportRows.filter((r) => ['submitted', 'location_verified', 'under_review'].includes(String(r.status).toLowerCase())).length;
    const assignedReports = reportRows.filter((r) => ['team_assigned', 'repair_in_progress'].includes(String(r.status).toLowerCase())).length;
    const resolvedRows = reportRows.filter((r) => String(r.status).toLowerCase() === 'resolved');
    const resolvedReports = resolvedRows.length;
    const highPriorityCount = reportRows.filter((r) => ['high', 'critical'].includes(String(r.priority).toLowerCase())).length;
    const activeTeamsCount = teamRows.filter((t) => ['active', 'available', 'on_duty', 'busy'].includes(String(t.status).toLowerCase())).length;
    const issueBreakdown: Record<string, number> = {};
    const wardBreakdown: Record<string, number> = {};

    reportRows.forEach((report) => {
      if (report.issue_type) issueBreakdown[report.issue_type] = (issueBreakdown[report.issue_type] || 0) + 1;
      if (report.ward_name) wardBreakdown[report.ward_name] = (wardBreakdown[report.ward_name] || 0) + 1;
    });

    const resolvedDurations = resolvedRows
      .filter((report) => report.submitted_at && report.resolved_at)
      .map((report) => (new Date(report.resolved_at!).getTime() - new Date(report.submitted_at!).getTime()) / 3_600_000)
      .filter((hours) => Number.isFinite(hours) && hours >= 0);
    const avgResolutionHours = resolvedDurations.length
      ? resolvedDurations.reduce((sum, hours) => sum + hours, 0) / resolvedDurations.length
      : 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyReports = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (11 - index));
      const dateKey = date.toISOString().slice(0, 10);
      const count = reportRows.filter((report) => {
        const submittedAt = report.submitted_at || report.created_at;
        return submittedAt ? new Date(submittedAt).toISOString().slice(0, 10) === dateKey : false;
      }).length;
      return { label: String(date.getDate()), count };
    });

    return {
      totalReports,
      pendingReports,
      assignedReports,
      resolvedReports,
      highPriorityCount,
      activeTeamsCount,
      avgResolutionHours,
      resolutionRatePct: totalReports ? Math.round((resolvedReports / totalReports) * 100) : 0,
      issueBreakdown,
      wardBreakdown,
      dailyReports,
    };
  },
};
