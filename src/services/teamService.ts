import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FieldTeam } from '../types';

export const teamService = {
  async getTeams(): Promise<FieldTeam[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    try {
      const [teamsResult, reportsResult] = await Promise.all([
        supabase
          .from('field_teams')
          .select('*, team_members(id, name, role, phone)')
          .order('name'),
        supabase
          .from('reports')
          .select('assigned_team_id, status')
          .not('assigned_team_id', 'is', null),
      ]);
      if (teamsResult.error) throw teamsResult.error;
      if (reportsResult.error) throw reportsResult.error;
      if (!teamsResult.data) return [];
      const activeTasksByTeam = new Map<string, number>();
      for (const report of reportsResult.data || []) {
        if (report.status === 'resolved' || report.status === 'rejected' || report.status === 'duplicate') continue;
        const teamId = report.assigned_team_id;
        if (teamId) activeTasksByTeam.set(teamId, (activeTasksByTeam.get(teamId) || 0) + 1);
      }

      return teamsResult.data.map((t: any) => {
        const members = (t.team_members || []).map((member: any) => ({
            id: member.id,
            name: member.name,
            role: member.role,
            phone: member.phone,
            avatarUrl: member.avatar_url,
        }));
        return {
          id: t.id,
          name: t.name,
          status: t.status === 'available' ? 'active' : t.status as FieldTeam['status'],
          assignedWards: t.assigned_wards || [],
          vehicleNumber: t.vehicle_number,
          membersCount: members.length,
          activeTasksCount: activeTasksByTeam.get(t.id) || 0,
          currentTask: t.current_task,
          members,
        };
      });
    } catch (error) {
      throw error;
    }
  },

  async createTeam(teamData: {
    name: string;
    vehicleNumber?: string;
    assignedWards: string[];
    membersCount: number;
  }): Promise<{ success: boolean; team?: FieldTeam; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    try {
      const requestedWards = [...new Set(teamData.assignedWards.map((ward) => ward.trim()).filter(Boolean))];
      if (!requestedWards.length) {
        return { success: false, error: 'Assign at least one existing municipal ward to the field team.' };
      }
      const { data: wards, error: wardsError } = await supabase
        .from('wards')
        .select('ward_number, ward_name')
        .not('boundary', 'is', null);
      if (wardsError) return { success: false, error: `Unable to validate municipal wards: ${wardsError.message}` };
      const wardByLabel = new Map<string, string>();
      for (const ward of wards || []) {
        wardByLabel.set(String(ward.ward_number || '').trim().toLowerCase(), ward.ward_number);
        wardByLabel.set(String(ward.ward_name || '').trim().toLowerCase(), ward.ward_number);
      }
      const matchedWards = requestedWards.map((label) => wardByLabel.get(label.toLowerCase()));
      if (matchedWards.some((wardNumber) => !wardNumber)) {
        return { success: false, error: 'Every assigned area must match a configured municipal ward number or name.' };
      }
      const normalizedWards = matchedWards.filter((wardNumber): wardNumber is string => Boolean(wardNumber));

      const { data, error } = await supabase
        .from('field_teams')
        .insert({
          name: teamData.name,
          vehicle_number: teamData.vehicleNumber,
          assigned_wards: normalizedWards,
          members_count: teamData.membersCount,
          status: 'available',
        })
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || 'Supabase did not return the created field team.' };
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
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unable to create field team.' };
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
