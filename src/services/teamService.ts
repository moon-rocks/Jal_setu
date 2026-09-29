import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FieldTeam } from '../types';

export const teamService = {
  async getTeams(): Promise<FieldTeam[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    try {
      const { data, error } = await supabase
        .from('field_teams')
        .select('*, team_members(id, name, role, phone)')
        .order('name');

      if (error) throw error;
      if (!data) return [];

      return data.map((t: any) => ({
        id: t.id,
        name: t.name,
        status: t.status === 'available' ? 'active' : t.status as FieldTeam['status'],
        assignedWards: t.assigned_wards || [],
        vehicleNumber: t.vehicle_number,
        membersCount: t.members_count || 0,
        activeTasksCount: t.active_tasks_count || 0,
        currentTask: t.current_task,
        members: (t.team_members || []).map((member: any) => ({
          id: member.id,
          name: member.name,
          role: member.role,
          phone: member.phone,
          avatarUrl: member.avatar_url,
        })),
      }));
    } catch (error) {
      throw error;
    }
  },

  async createTeam(teamData: {
    name: string;
    vehicleNumber?: string;
    assignedWards: string[];
    membersCount: number;
  }): Promise<{ success: boolean; team?: FieldTeam }> {
    if (!isSupabaseConfigured) {
      return { success: false };
    }

    try {
      const { data, error } = await supabase
        .from('field_teams')
        .insert({
          name: teamData.name,
          vehicle_number: teamData.vehicleNumber,
          assigned_wards: teamData.assignedWards,
          members_count: teamData.membersCount,
          status: 'available',
        })
        .select()
        .single();

      if (error || !data) {
        return { success: false };
      }

      return {
        success: true,
        team: {
          id: data.id,
          name: data.name,
          status: data.status,
          assignedWards: data.assigned_wards,
          vehicleNumber: data.vehicle_number,
          membersCount: data.members_count,
          activeTasksCount: 0,
        },
      };
    } catch {
      return { success: false };
    }
  },

  async assignTeamToReport(
    reportId: string,
    teamId: string,
    options?: { teamName?: string; assignedBy?: string; notes?: string }
  ): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      // Resolve report UUID
      let targetReportUuid = reportId;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reportId)) {
        const { data: rep, error: reportLookupError } = await supabase
          .from('reports')
          .select('id')
          .eq('report_number', reportId)
          .maybeSingle();
        if (reportLookupError || !rep) return false;
        targetReportUuid = rep.id;
      }

      // Resolve team UUID
      let targetTeamUuid = teamId;
      let finalTeamName = options?.teamName;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId)) {
        const { data: t, error: teamLookupError } = await supabase
          .from('field_teams')
          .select('id, name')
          .eq('name', teamId)
          .maybeSingle();
        if (teamLookupError || !t) return false;
        if (t) {
          targetTeamUuid = t.id;
          finalTeamName = t.name;
        }
      }

      // Record in team_assignments table
      const { data: { user } } = await supabase.auth.getUser();
      const { data: report, error: reportLookupError } = await supabase.from('reports').select('id').eq('id', targetReportUuid).maybeSingle();
      if (reportLookupError || !report) return false;
      const { data: team, error: targetTeamError } = await supabase.from('field_teams').select('id, name').eq('id', targetTeamUuid).maybeSingle();
      if (targetTeamError || !team) return false;
      const { error: assignmentError } = await supabase.from('team_assignments').insert({
        report_id: targetReportUuid,
        team_id: targetTeamUuid,
        assigned_by: user?.id || null,
        status: 'assigned',
        notes: options?.notes || null,
      });
      if (assignmentError) return false;

      // Update report status and team reference
      const { error: reportUpdateError } = await supabase.from('reports').update({
        status: 'team_assigned',
        assigned_team_id: targetTeamUuid,
        assigned_at: new Date().toISOString(),
      }).eq('id', targetReportUuid);
      if (reportUpdateError) return false;

      // Increment team active tasks count
      const { error: teamUpdateError } = await supabase.from('field_teams').update({
        status: 'on_duty',
      }).eq('id', targetTeamUuid);
      if (teamUpdateError) return false;

      return true;
    } catch (err) {
      console.warn('Error assigning team to report:', err);
      return false;
    }
  },

  async updateTeamStatus(teamId: string, status: 'active' | 'available' | 'on_duty' | 'busy' | 'offline'): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase
        .from('field_teams')
        .update({ status: status === 'active' ? 'available' : status })
        .eq('id', teamId);
      return !error;
    } catch {
      return false;
    }
  },
};
