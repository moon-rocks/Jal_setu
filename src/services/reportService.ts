import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { IssueType, PriorityLevel, ReportItem, ReportStatus } from '../types';

async function getAuthenticatedCitizenUser() {
  if (!isSupabaseConfigured) return null;

  const sessionResult = await supabase.auth.getSession();
  const sessionUser = sessionResult.data.session?.user ?? null;
  if (sessionUser) return sessionUser;

  const userResult = await supabase.auth.getUser();
  return userResult.data.user ?? null;
}

export interface CreateReportDTO {
  issueType: IssueType;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  wardName?: string;
  city?: string;
  address?: string;
  photoBlob?: Blob | null;
  photoUrl?: string;
}

function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export const reportService = {
  async getReports(options?: {
    citizenOnly?: boolean;
    status?: string;
    ward?: string;
    limit?: number;
  }): Promise<ReportItem[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    try {
      let query = supabase
        .from('reports')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (options?.citizenOnly) {
        const user = await getAuthenticatedCitizenUser();
        if (!user) return [];
        query = query.eq('citizen_id', user.id);
      }

      if (options?.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }

      if (options?.ward && options.ward !== 'all') {
        query = query.eq('ward_name', options.ward);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data) return [];

      return Promise.all(data.map((item: any) => this.mapRowToReport(item)));
    } catch (e) {
      throw e;
    }
  },

  async getReportById(id: string): Promise<ReportItem | null> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    try {
      let query = supabase.from('reports').select('*');
      if (isUuid(id)) {
        query = query.or(`id.eq.${id},report_number.eq.${id}`);
      } else {
        query = query.eq('report_number', id);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return await this.mapRowToReport(data);
    } catch (e) {
      throw e;
    }
  },

  async createReport(dto: CreateReportDTO): Promise<{ success: boolean; report?: ReportItem; error?: string }> {
    if (!isSupabaseConfigured) return { success: false, error: 'Supabase is not configured.' };
    const reportNumber = `JS-${Math.floor(10000 + Math.random() * 90000)}`;
    let photoUrl = dto.photoUrl;

    const invokeAiAnalysisSafely = async (payload: Record<string, unknown>) => {
      const invokePromise = supabase.functions.invoke('analyze-report', { body: payload });
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI analysis timeout after 12 seconds.')), 12000);
      });

      const result = await Promise.race([invokePromise, timeoutPromise]);
      const parsed = result?.data ?? {};
      if (parsed?.success === false || parsed?.error) {
        throw new Error(parsed?.error || 'AI analysis did not complete successfully.');
      }
      return parsed;
    };

    try {
      const user = await getAuthenticatedCitizenUser();
      if (!user) {
        return { success: false, error: 'You must be signed in to submit a report.' };
      }

      const priority = dto.issueType === 'pipeline_leakage' || dto.issueType === 'no_water' ? 'high' : 'medium';
      const fullAddress = dto.address
        ? `${dto.wardName ? `${dto.wardName} · ` : ''}${dto.address}`
        : null;
      const insertPayload: Record<string, unknown> = {
        report_number: reportNumber,
        citizen_id: user.id,
        issue_type: dto.issueType,
        title: dto.title,
        description: dto.description || null,
        status: 'submitted',
        priority,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        ward_name: dto.wardName || null,
        city: dto.city || null,
        address: fullAddress,
        photo_url: dto.photoUrl || null,
      };

      const { data, error } = await supabase.from('reports').insert(insertPayload).select().single();
      if (error || !data) return { success: false, error: error?.message || 'Unable to create report.' };

      if (dto.photoBlob) {
        try {
          const extension = dto.photoBlob.type.split('/')[1] || 'jpg';
          const uploaded = await supabase.storage.from('report-photos').upload(
            `${data.id}/citizen/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`,
            dto.photoBlob,
            { contentType: dto.photoBlob.type || 'image/jpeg', upsert: false },
          );
          if (uploaded.error) throw uploaded.error;
          const storagePath = uploaded.data.path;
          const { error: photoError } = await supabase.from('report_photos').insert({
            report_id: data.id,
            storage_path: storagePath,
            photo_type: 'evidence',
            file_size: dto.photoBlob.size,
            mime_type: dto.photoBlob.type || null,
            latitude: dto.latitude,
            longitude: dto.longitude,
          });
          if (photoError) throw photoError;
          const { error: updatePhotoError } = await supabase.from('reports').update({ photo_url: storagePath }).eq('id', data.id);
          if (updatePhotoError) throw updatePhotoError;
          photoUrl = await this.getSignedPhotoUrl(storagePath);
        } catch (photoError) {
          console.warn('Report photo upload failed:', photoError);
        }
      }

      try {
        const aiResult = await invokeAiAnalysisSafely({
          reportId: data.id,
          photoUrl,
          issueType: dto.issueType,
          description: dto.description,
          latitude: dto.latitude,
          longitude: dto.longitude,
          wardName: dto.wardName,
        });

        if (aiResult?.success) {
          await supabase.from('reports').update({
            ai_status: 'verified_by_ai',
            ai_confidence: aiResult.confidence ?? null,
            ai_evidence: Array.isArray(aiResult.detectedFeatures) ? aiResult.detectedFeatures : [],
            updated_at: new Date().toISOString(),
          }).eq('id', data.id);
        } else {
          await supabase.from('reports').update({
            ai_status: 'human_review_required',
            updated_at: new Date().toISOString(),
          }).eq('id', data.id);
        }
      } catch (edgeError) {
        console.warn('Edge function invoke note:', edgeError);
        await supabase.from('reports').update({
          ai_status: 'human_review_required',
          updated_at: new Date().toISOString(),
        }).eq('id', data.id);
      }

      return { success: true, report: { ...(await this.mapRowToReport(data)), photoUrl } };
    } catch (error) {
      console.warn('Supabase report insert failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unable to create report.' };
    }
  },

  async updateReportStatus(reportId: string, newStatus: ReportStatus, options?: {
    assignedTeamId?: string;
    assignedTeamName?: string;
    reason?: string;
  }): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const payload: Record<string, any> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'location_verified') {
        payload.verified_at = new Date().toISOString();
      } else if (newStatus === 'team_assigned') {
        payload.assigned_at = new Date().toISOString();
        if (options?.assignedTeamId) payload.assigned_team_id = options.assignedTeamId;
        if (options?.assignedTeamName) payload.assigned_team_name = options.assignedTeamName;
      } else if (newStatus === 'repair_in_progress') {
        payload.started_at = new Date().toISOString();
      } else if (newStatus === 'resolved') {
        payload.resolved_at = new Date().toISOString();
      }

      let findQuery = supabase.from('reports').select('id, citizen_id, status, report_number');
      if (isUuid(reportId)) {
        findQuery = findQuery.or(`id.eq.${reportId},report_number.eq.${reportId}`);
      } else {
        findQuery = findQuery.eq('report_number', reportId);
      }
      const { data: repData } = await findQuery.maybeSingle();

      let updateQuery = supabase.from('reports').update(payload);
      if (isUuid(reportId)) {
        updateQuery = updateQuery.or(`id.eq.${reportId},report_number.eq.${reportId}`);
      } else {
        updateQuery = updateQuery.eq('report_number', reportId);
      }
      const { error } = await updateQuery;

      if (repData?.citizen_id) {
        try {
          // Dispatch notification to reporting citizen if registered
          await supabase.from('notifications').insert({
            user_id: repData.citizen_id,
            report_id: repData.id,
            title: `Report ${repData.report_number} Update`,
            message: `Your water problem report status has been updated to ${newStatus.replace(/_/g, ' ')}.`,
            type: 'report_status',
          });
        } catch (notificationError) {
          console.warn('Report status notification note:', notificationError);
        }
      }

      return !error;
    } catch (e) {
      console.error('Failed to update report status:', e);
      return false;
    }
  },

  async getStatusHistory(reportId: string) {
    if (!isSupabaseConfigured) return [];
    try {
      let targetUuid = reportId;
      if (!isUuid(reportId)) {
        const { data: rep } = await supabase
          .from('reports')
          .select('id')
          .eq('report_number', reportId)
          .maybeSingle();
        if (rep) {
          targetUuid = rep.id;
        } else {
          return [];
        }
      }

      const { data } = await supabase
        .from('report_status_history')
        .select('*')
        .eq('report_id', targetUuid)
        .order('created_at', { ascending: true });
      return data || [];
    } catch {
      return [];
    }
  },

  async getAiAnalysis(reportId: string) {
    if (!isSupabaseConfigured) return null;
    try {
      let targetUuid = reportId;
      if (!isUuid(reportId)) {
        const { data: rep } = await supabase
          .from('reports')
          .select('id')
          .eq('report_number', reportId)
          .maybeSingle();
        if (rep) {
          targetUuid = rep.id;
        } else {
          return null;
        }
      }

      const { data } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('report_id', targetUuid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return data || null;
    } catch {
      return null;
    }
  },

  async getSignedPhotoUrl(photoPath?: string | null): Promise<string | undefined> {
    if (!photoPath) return undefined;
    if (/^https?:\/\//i.test(photoPath)) return photoPath;
    const { data, error } = await supabase.storage.from('report-photos').createSignedUrl(photoPath, 3600);
    return error ? undefined : data.signedUrl;
  },

  async mapRowToReport(row: any): Promise<ReportItem> {
    const rawStatus = String(row.status || '').toLowerCase();
    const rawPriority = String(row.priority || '').toLowerCase();
    const rawIssue = String(row.issue_type || '').toLowerCase();

    // Parse ward from ward_name column or address prefix if stored as 'Ward X · Street'
    let detectedWard = row.ward_name;
    if (!detectedWard && row.address) {
      if (row.address.includes('·')) {
        detectedWard = row.address.split('·')[0].trim();
      } else if (row.address.includes('Ward')) {
        const match = row.address.match(/Ward\s+\d+/i);
        if (match) detectedWard = match[0];
      }
    }

    const submittedAt = row.submitted_at || row.created_at;
    return {
      id: row.report_number || row.id,
      issueType: rawIssue as IssueType,
      issueTitle: row.title,
      description: row.description,
      status: rawStatus as ReportStatus,
      priority: rawPriority as PriorityLevel,
      location: {
        ward: detectedWard || '',
        city: row.city || '',
        latitude: row.latitude,
        longitude: row.longitude,
        accuracy: row.accuracy ?? undefined,
        address: row.address,
      },
      submittedAt: submittedAt ? new Date(submittedAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }) : '',
      photoUrl: await this.getSignedPhotoUrl(row.photo_url),
      aiStatus: row.ai_status || 'not_run',
      aiConfidence: row.ai_confidence ?? undefined,
      aiSummary: row.ai_summary ?? undefined,
      aiRecommendation: row.ai_recommendation ?? undefined,
      aiEvidence: row.ai_evidence || [],
      assignedTeamId: row.assigned_team_id,
      assignedTeamName: row.assigned_team_name,
    };
  },

};
