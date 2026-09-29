import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  TeamMemberProfile,
  CreateTeamMemberDTO,
  UpdateTeamMemberDTO,
  AssignedReportItem,
  WorkStatus,
  WorkUpdateItem,
  TeamNotificationItem,
} from '../types/teamMember';
import { auditService } from './auditService';

const buildApiUrl = (path: string) => {
  const configuredBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (configuredBase) {
    return `${configuredBase}${normalizedPath}`;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalizedPath}`;
  }

  return normalizedPath;
};

const readJsonResponse = async <T = any>(response: Response): Promise<{ ok: boolean; data?: T; error?: string }> => {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  const trimmedText = text.trim();

  if (!trimmedText) {
    return {
      ok: response.ok,
      error: response.ok ? 'Empty response from server.' : `Request failed (${response.status})`,
    };
  }

  if (!contentType.includes('application/json')) {
    return {
      ok: false,
      error: trimmedText.slice(0, 220).replace(/\s+/g, ' ') || `Request failed (${response.status})`,
    };
  }

  try {
    const data = JSON.parse(trimmedText) as T;
    return {
      ok: response.ok,
      data,
      error: response.ok
        ? undefined
        : (typeof data === 'object' && data && 'error' in (data as object))
          ? String((data as any).error)
          : `Request failed (${response.status})`,
    };
  } catch {
    return {
      ok: false,
      error: trimmedText.slice(0, 220).replace(/\s+/g, ' ') || 'Server returned an invalid JSON response.',
    };
  }
};

const requireSupabase = () => {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
};

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const mapReportRow = (row: any): AssignedReportItem => {
  const rawStatus = String(row.status || '').toLowerCase();
  const status: WorkStatus = rawStatus === 'team_assigned'
    ? 'assigned'
    : rawStatus === 'repair_in_progress'
      ? 'in_progress'
      : rawStatus === 'resolved'
        ? 'completed'
        : (rawStatus as WorkStatus);

  return {
    id: row.id,
    reportNumber: row.report_number || row.id,
    title: row.title || '',
    issueType: row.issue_type || '',
    description: row.description || '',
    priority: row.priority || 'medium',
    status,
    location: {
      ward: row.ward_name || '',
      city: row.city || '',
      latitude: row.latitude,
      longitude: row.longitude,
      accuracy: row.accuracy,
      address: row.address || undefined,
    },
    citizenReportDate: row.submitted_at || row.created_at || '',
    assignedDate: row.assigned_at || '',
    assignedBy: row.assigned_by_name || undefined,
    deadline: row.assignment_deadline || undefined,
    instructions: row.assignment_instructions || undefined,
    assignedMemberId: row.assigned_member_id || undefined,
    assignedMemberName: row.assigned_member_name || undefined,
    beforePhotoUrl: row.before_photo_url || undefined,
    duringPhotoUrl: row.during_photo_url || undefined,
    afterPhotoUrl: row.after_photo_url || undefined,
    completionNotes: row.completion_notes || row.repair_notes || undefined,
    completedAt: row.completed_at || row.resolved_at || undefined,
    adminVerifiedBy: row.admin_verified_by || undefined,
    adminVerificationNotes: row.admin_verification_notes || undefined,
    adminVerifiedAt: row.verified_at || undefined,
  };
};

const mapWorkUpdate = (row: any): WorkUpdateItem => ({
  id: row.id,
  reportId: row.report_id,
  teamMemberId: row.team_member_id || undefined,
  teamMemberName: row.team_member_name || '',
  updateType: row.update_type,
  message: row.message,
  photoUrl: row.photo_url || undefined,
  createdAt: row.created_at,
});

const mapTeamMember = (row: any): TeamMemberProfile => ({
  id: row.id,
  userId: row.user_id || row.profile_id || row.id,
  name: row.name || row.full_name || '',
  email: row.email || '',
  phone: row.phone || '',
  designation: row.designation || row.role || '',
  department: row.department || '',
  assignedArea: row.assigned_area || row.ward || '',
  ward: row.ward || '',
  teamName: row.team_name || '',
  teamId: row.team_id || undefined,
  status: row.status === 'inactive' ? 'inactive' : 'active',
  responsibilities: row.responsibilities || '',
  assignedReportsCount: row.assigned_reports_count || 0,
  completedReportsCount: row.completed_reports_count || 0,
  avatarUrl: row.avatar_url || undefined,
  lastActivityAt: row.last_activity_at || row.updated_at || undefined,
  createdAt: row.created_at || '',
});

const reportQuery = (id: string) => {
  const query = supabase.from('reports').select('*');
  return isUuid(id) ? query.eq('id', id) : query.eq('report_number', id);
};

export const teamMemberService = {
  async getTeamMembers(filters?: {
    search?: string;
    department?: string;
    status?: 'active' | 'inactive' | 'all';
    area?: string;
  }): Promise<TeamMemberProfile[]> {
    requireSupabase();
    let query = supabase.from('team_members').select('*').order('created_at', { ascending: false });
    if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters?.department && filters.department !== 'all') query = query.eq('department', filters.department);

    const { data, error } = await query;
    if (error) throw error;
    let members = (data || []).map(mapTeamMember);

    if (filters?.search) {
      const value = filters.search.toLowerCase();
      members = members.filter((member) => [member.name, member.email, member.phone, member.designation, member.assignedArea, member.ward]
        .some((field) => field.toLowerCase().includes(value)));
    }
    if (filters?.area && filters.area !== 'all') {
      members = members.filter((member) => member.assignedArea === filters.area || member.ward === filters.area);
    }

    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('assigned_member_id, status')
      .in('assigned_member_id', members.map((member) => member.id));
    if (reportsError) throw reportsError;

    return members.map((member) => {
      const assigned = (reports || []).filter((report) => report.assigned_member_id === member.id);
      return {
        ...member,
        assignedReportsCount: assigned.length,
        completedReportsCount: assigned.filter((report) => report.status === 'resolved').length,
        inProgressCount: assigned.filter((report) => report.status === 'repair_in_progress').length,
        pendingCount: assigned.filter((report) => report.status === 'team_assigned').length,
        verifiedCount: assigned.filter((report) => report.status === 'resolved').length,
      };
    });
  },

  async getTeamMemberById(id: string): Promise<TeamMemberProfile | null> {
    requireSupabase();
    if (isUuid(id)) {
      const { data, error } = await supabase.from('team_members').select('*')
        .or(`id.eq.${id},user_id.eq.${id},profile_id.eq.${id}`).maybeSingle();
      if (error) throw error;
      return data ? mapTeamMember(data) : null;
    }
    const { data, error } = await supabase.from('team_members').select('*').eq('email', id).maybeSingle();
    if (error) throw error;
    return data ? mapTeamMember(data) : null;
  },

  async createTeamMember(dto: CreateTeamMemberDTO): Promise<{ success: boolean; teamMember?: TeamMemberProfile; error?: string }> {
    requireSupabase();
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const response = await fetch(buildApiUrl('/api/admin/create-team-member'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(dto),
      });
      const result = await readJsonResponse<{ success?: boolean; teamMember?: any; error?: string }>(response);
      if (!response.ok || !result.data?.success || !result.data.teamMember) {
        return { success: false, error: result.error || result.data?.error || 'Unable to provision the Supabase Auth account.' };
      }
      return { success: true, teamMember: mapTeamMember(result.data.teamMember) };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unable to reach the provisioning service.' };
    }
  },

  async updateTeamMember(id: string, updates: UpdateTeamMemberDTO): Promise<boolean> {
    requireSupabase();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.fullName !== undefined) payload.name = updates.fullName;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.designation !== undefined) {
      payload.designation = updates.designation;
      payload.role = updates.designation;
    }
    if (updates.department !== undefined) payload.department = updates.department;
    if (updates.assignedArea !== undefined) payload.assigned_area = updates.assignedArea;
    if (updates.ward !== undefined) payload.ward = updates.ward;
    if (updates.teamName !== undefined) payload.team_name = updates.teamName;
    if (updates.responsibilities !== undefined) payload.responsibilities = updates.responsibilities;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    const { error } = await supabase.from('team_members').update(payload).eq('id', id);
    if (error) return false;
    await auditService.logAction('UPDATE_TEAM_MEMBER', 'TEAM_MEMBER', id, updates);
    return true;
  },

  async toggleStatus(id: string, newStatus: 'active' | 'inactive'): Promise<boolean> {
    requireSupabase();
    const { error } = await supabase.from('team_members').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return false;
    await auditService.logAction(newStatus === 'active' ? 'ENABLE_TEAM_MEMBER' : 'DISABLE_TEAM_MEMBER', 'TEAM_MEMBER', id, { status: newStatus });
    return true;
  },

  async resetPassword(email: string, memberId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const response = await fetch(buildApiUrl('/api/admin/reset-team-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, memberId }),
      });
      const result = await readJsonResponse<{ success?: boolean; error?: string }>(response);
      return response.ok && !!result.data?.success;
    } catch {
      return false;
    }
  },

  async getAllAssignedReports(): Promise<AssignedReportItem[]> {
    requireSupabase();
    const { data, error } = await supabase.from('reports').select('*').not('assigned_member_id', 'is', null).order('assigned_at', { ascending: false });
    if (error) throw error;
    return Promise.all((data || []).map((row) => this.signReportEvidence(mapReportRow(row))));
  },

  async getAssignedReports(memberIdOrEmail: string, filter?: { status?: string; priority?: string; search?: string }): Promise<AssignedReportItem[]> {
    const member = await this.getTeamMemberById(memberIdOrEmail);
    if (!member) return [];
    let reports = (await this.getAllAssignedReports()).filter((report) => report.assignedMemberId === member.id);
    if (filter?.status && filter.status !== 'all') reports = reports.filter((report) => report.status === filter.status);
    if (filter?.priority && filter.priority !== 'all') reports = reports.filter((report) => report.priority === filter.priority);
    if (filter?.search) {
      const value = filter.search.toLowerCase();
      reports = reports.filter((report) => [report.title, report.reportNumber, report.location.address || '', report.location.ward]
        .some((field) => field.toLowerCase().includes(value)));
    }
    return reports;
  },

  async getAssignedReportById(reportId: string, memberId?: string): Promise<AssignedReportItem | null> {
    requireSupabase();
    const { data, error } = await reportQuery(reportId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    if (memberId) {
      const member = await this.getTeamMemberById(memberId);
      if (!member || data.assigned_member_id !== member.id) return null;
    }
    return this.signReportEvidence(mapReportRow(data));
  },

  async updateWorkStatus(reportId: string, memberId: string, newStatus: WorkStatus, options?: { notes?: string; photoUrl?: string }): Promise<{ success: boolean; error?: string }> {
    if (newStatus === 'admin_verified') return { success: false, error: 'Only an administrator can verify completed reports.' };
    requireSupabase();
    const report = await this.getAssignedReportById(reportId, memberId);
    if (!report) return { success: false, error: 'Assigned report not found.' };
    const nextStatus = newStatus === 'completed' ? 'resolved' : newStatus === 'in_progress' ? 'repair_in_progress' : 'team_assigned';
    const payload: Record<string, unknown> = { status: nextStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'completed') {
      payload.completed_at = new Date().toISOString();
      payload.completion_notes = options?.notes;
      payload.repair_notes = options?.notes;
      if (options?.photoUrl) payload.after_photo_url = options.photoUrl;
    }
    const { error } = await this.updateReportById(reportId, payload);
    if (error) return { success: false, error: error.message };
    await auditService.logAction('WORK_STATUS_CHANGED', 'REPORT', reportId, { fromStatus: report.status, toStatus: newStatus, changedBy: memberId, notes: options?.notes });
    await this.addWorkUpdate(reportId, {
      teamMemberId: memberId,
      teamMemberName: report.assignedMemberName || '',
      updateType: newStatus === 'accepted' ? 'work_started' : newStatus === 'in_progress' ? 'repair_started' : 'repair_completed',
      message: options?.notes || `Status advanced to ${newStatus.replace('_', ' ')}`,
      photoUrl: options?.photoUrl,
    });
    return { success: true };
  },

  async adminVerifyReport(reportId: string, adminId: string, approved: boolean, feedbackNotes: string): Promise<{ success: boolean; error?: string }> {
    requireSupabase();
    const report = await this.getAssignedReportById(reportId);
    if (!report) return { success: false, error: 'Report not found.' };
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await this.updateReportById(reportId, {
      status: approved ? 'resolved' : 'repair_in_progress',
      verified_at: approved ? new Date().toISOString() : null,
      admin_verified_by: approved ? user?.id || null : null,
      admin_verification_notes: feedbackNotes,
    });
    if (error) return { success: false, error: error.message };
    await auditService.logAction(approved ? 'ADMIN_VERIFIED_REPORT' : 'ADMIN_REJECTED_COMPLETION', 'REPORT', reportId, { adminId, feedbackNotes });
    if (report.assignedMemberId) {
      await this.sendNotification({
        userId: report.assignedMemberId,
        title: approved ? `Work Approved: ${report.reportNumber}` : `Action Required: ${report.reportNumber}`,
        message: feedbackNotes,
        type: approved ? 'approved' : 'rejected',
        reportId: report.id,
      });
    }
    return { success: true };
  },

  async getWorkUpdates(reportId: string): Promise<WorkUpdateItem[]> {
    requireSupabase();
    const reportUuid = await this.resolveReportUuid(reportId);
    if (!reportUuid) return [];
    const { data, error } = await supabase.from('report_work_updates').select('*').eq('report_id', reportUuid).order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapWorkUpdate);
  },

  async getRecentWorkUpdates(memberId: string, limit = 5): Promise<WorkUpdateItem[]> {
    requireSupabase();
    const member = await this.getTeamMemberById(memberId);
    if (!member) return [];
    const { data, error } = await supabase.from('report_work_updates').select('*').eq('team_member_id', member.id).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map(mapWorkUpdate);
  },

  async addWorkUpdate(reportId: string, update: Omit<WorkUpdateItem, 'id' | 'reportId' | 'createdAt'>): Promise<WorkUpdateItem> {
    requireSupabase();
    const reportUuid = await this.resolveReportUuid(reportId);
    if (!reportUuid) throw new Error('Report not found.');
    const { data, error } = await supabase.from('report_work_updates').insert({
      report_id: reportUuid,
      team_member_id: update.teamMemberId,
      team_member_name: update.teamMemberName,
      update_type: update.updateType,
      message: update.message,
      photo_url: update.photoUrl,
    }).select().single();
    if (error || !data) throw error || new Error('Unable to save work update.');
    await auditService.logAction('WORK_UPDATE_ADDED', 'REPORT', reportUuid, { type: update.updateType, member: update.teamMemberName });
    return mapWorkUpdate(data);
  },

  async uploadEvidencePhoto(reportId: string, file: File | Blob, photoType: 'before' | 'during' | 'after'): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
    if (!isSupabaseConfigured) return { success: false, error: 'Supabase is not configured.' };
    const reportUuid = await this.resolveReportUuid(reportId);
    if (!reportUuid) return { success: false, error: 'Report not found.' };
    const extension = file instanceof File ? file.name.split('.').pop() || 'jpg' : 'jpg';
    const path = `${reportUuid}/team-evidence/${photoType}_${Date.now()}.${extension}`;
    const { data, error } = await supabase.storage.from('report-photos').upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
    if (error || !data) return { success: false, error: error?.message || 'Unable to upload evidence.' };
    const { data: urlData, error: urlError } = await supabase.storage.from('report-photos').createSignedUrl(data.path, 3600);
    if (urlError) return { success: false, error: urlError.message };
    const column = photoType === 'before' ? 'before_photo_url' : photoType === 'during' ? 'during_photo_url' : 'after_photo_url';
    const { error: updateError } = await supabase.from('reports').update({ [column]: data.path, updated_at: new Date().toISOString() }).eq('id', reportUuid);
    if (updateError) return { success: false, error: updateError.message };
    return { success: true, publicUrl: urlData.signedUrl };
  },

  async assignReportToMember(reportId: string, teamMemberId: string, options?: { deadline?: string; instructions?: string; assignedBy?: string }): Promise<{ success: boolean; error?: string }> {
    requireSupabase();
    const member = await this.getTeamMemberById(teamMemberId);
    if (!member) return { success: false, error: 'Team member not found.' };
    const { data: report, error: reportError } = await reportQuery(reportId).maybeSingle();
    if (reportError || !report) return { success: false, error: reportError?.message || 'Report not found.' };
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('reports').update({
      assigned_member_id: member.id,
      assigned_member_name: member.name,
      assigned_team_id: member.teamId,
      assigned_team_name: member.teamName,
      assignment_deadline: options?.deadline || null,
      assignment_instructions: options?.instructions || null,
      assigned_by_name: options?.assignedBy || userData.user?.email || null,
      status: 'team_assigned',
      assigned_at: new Date().toISOString(),
    }).eq('id', report.id);
    if (error) return { success: false, error: error.message };
    await auditService.logAction('ASSIGN_REPORT', 'REPORT', report.id, { memberId: member.id, deadline: options?.deadline });
    await this.sendNotification({ userId: member.userId, title: `New Assignment: ${report.report_number}`, message: report.title, type: 'assignment', reportId: report.id });
    return { success: true };
  },

  async getTeamNotifications(memberId?: string): Promise<TeamNotificationItem[]> {
    requireSupabase();
    const userId = memberId || (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return [];
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      reportId: row.report_id || undefined,
      isRead: row.is_read,
      createdAt: row.created_at,
    }));
  },

  async markNotificationRead(id: string): Promise<void> {
    requireSupabase();
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },

  async sendNotification(payload: { userId: string; title: string; message: string; type: 'assignment' | 'assignment_changed' | 'priority_changed' | 'admin_message' | 'deadline' | 'approved' | 'rejected'; reportId?: string }): Promise<void> {
    requireSupabase();
    const { error } = await supabase.from('notifications').insert({
      user_id: payload.userId,
      report_id: payload.reportId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      is_read: false,
    });
    if (error) throw error;
  },

  async resolveReportUuid(reportId: string): Promise<string | null> {
    requireSupabase();
    if (isUuid(reportId)) return reportId;
    const { data, error } = await supabase.from('reports').select('id').eq('report_number', reportId).maybeSingle();
    if (error) throw error;
    return data?.id || null;
  },

  async signReportEvidence(report: AssignedReportItem): Promise<AssignedReportItem> {
    const signPath = async (path?: string) => {
      if (!path || /^https?:\/\//i.test(path)) return path;
      const { data, error } = await supabase.storage.from('report-photos').createSignedUrl(path, 3600);
      return error ? undefined : data.signedUrl;
    };
    const [beforePhotoUrl, duringPhotoUrl, afterPhotoUrl] = await Promise.all([
      signPath(report.beforePhotoUrl),
      signPath(report.duringPhotoUrl),
      signPath(report.afterPhotoUrl),
    ]);
    return { ...report, beforePhotoUrl, duringPhotoUrl, afterPhotoUrl };
  },

  async updateReportById(reportId: string, payload: Record<string, unknown>) {
    const reportUuid = await this.resolveReportUuid(reportId);
    if (!reportUuid) return { error: new Error('Report not found.') };
    return supabase.from('reports').update(payload).eq('id', reportUuid);
  },
};
