import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface TeamWorkloadEntry {
  teamId: string;
  teamName: string;
  membersCount: number;
  activeReports: number;
  highPriorityReports: number;
  loadScore: number;
}

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
  teamWorkload: TeamWorkloadEntry[];
}

export interface DashboardFilters {
  dateRange?: '7d' | '30d' | '90d' | 'all';
  ward?: string;
  issueType?: string;
}

const normalizeStatus = (value?: string) => String(value ?? '').toLowerCase();

const addDateFilter = (query: any, dateRange?: DashboardFilters['dateRange']) => {
  if (!dateRange || dateRange === 'all') return query;

  const numberOfDays = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - numberOfDays);
  return query.gte('submitted_at', fromDate.toISOString());
};

export const analyticsService = {
  async getDashboardMetrics(filters: DashboardFilters = {}): Promise<DashboardAnalytics> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    let reportsQuery = supabase
      .from('reports')
      .select('id, status, priority, issue_type, ward_name, created_at, submitted_at, resolved_at, assigned_team_id, assigned_team_name, assigned_member_id');

    if (filters.ward && filters.ward !== 'all') {
      reportsQuery = reportsQuery.eq('ward_name', filters.ward);
    }

    if (filters.issueType && filters.issueType !== 'all') {
      reportsQuery = reportsQuery.eq('issue_type', filters.issueType);
    }

    reportsQuery = addDateFilter(reportsQuery, filters.dateRange);

    const [{ data: reports, error: reportsError }, { data: teams, error: teamsError }] = await Promise.all([
      reportsQuery.order('submitted_at', { ascending: false }),
      supabase.from('field_teams').select('id, name, status, active_tasks_count, members_count'),
    ]);

    if (reportsError) throw reportsError;
    if (teamsError) throw teamsError;

    const reportRows = reports || [];
    const teamRows = teams || [];
    const totalReports = reportRows.length;
    const pendingReports = reportRows.filter((r) => ['submitted', 'location_verified', 'under_review'].includes(normalizeStatus(r.status))).length;
    const assignedReports = reportRows.filter((r) => ['team_assigned', 'repair_in_progress'].includes(normalizeStatus(r.status))).length;
    const resolvedRows = reportRows.filter((r) => normalizeStatus(r.status) === 'resolved');
    const resolvedReports = resolvedRows.length;
    const highPriorityCount = reportRows.filter((r) => ['high', 'critical'].includes(normalizeStatus(r.priority))).length;
    const activeTeamsCount = teamRows.filter((t) => ['active', 'available', 'on_duty', 'busy'].includes(normalizeStatus(t.status))).length;

    const issueBreakdown: Record<string, number> = {};
    const wardBreakdown: Record<string, number> = {};

    reportRows.forEach((report) => {
      if (report.issue_type) {
        issueBreakdown[report.issue_type] = (issueBreakdown[report.issue_type] || 0) + 1;
      }
      if (report.ward_name) {
        wardBreakdown[report.ward_name] = (wardBreakdown[report.ward_name] || 0) + 1;
      }
    });

    const resolvedDurations = resolvedRows
      .filter((report) => report.submitted_at && report.resolved_at)
      .map((report) => {
        const diffMs = new Date(report.resolved_at).getTime() - new Date(report.submitted_at).getTime();
        return diffMs / 3_600_000;
      })
      .filter((hours) => Number.isFinite(hours) && hours >= 0);

    const avgResolutionHours = resolvedDurations.length
      ? resolvedDurations.reduce((sum, hours) => sum + hours, 0) / resolvedDurations.length
      : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayWindow = filters.dateRange && filters.dateRange !== 'all' ? Number(filters.dateRange.replace('d', '')) : 30;
    const dailyReports = Array.from({ length: Math.min(dayWindow, 30) }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (Math.min(dayWindow, 30) - 1 - index));
      const dateKey = date.toISOString().slice(0, 10);
      const count = reportRows.filter((report) => {
        const submittedAt = report.submitted_at || report.created_at;
        return submittedAt ? new Date(submittedAt).toISOString().slice(0, 10) === dateKey : false;
      }).length;

      return { label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count };
    });

    const teamWorkload: TeamWorkloadEntry[] = (teamRows || []).map((team) => {
      const teamReports = reportRows.filter((report) => {
        const matchesTeam = report.assigned_team_id === team.id || report.assigned_team_name === team.name;
        return matchesTeam && ['team_assigned', 'repair_in_progress', 'under_review', 'submitted'].includes(normalizeStatus(report.status));
      });
      const highPriorityReports = teamReports.filter((report) => ['high', 'critical'].includes(normalizeStatus(report.priority))).length;
      const loadScore = Math.min(100, Math.max(0, teamReports.length * 25 + highPriorityReports * 15 + (team.active_tasks_count || 0) * 10));

      return {
        teamId: team.id,
        teamName: team.name,
        membersCount: Number(team.members_count || 0),
        activeReports: teamReports.length,
        highPriorityReports,
        loadScore,
      };
    }).sort((a, b) => b.loadScore - a.loadScore);

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
      teamWorkload,
    };
  },
};
