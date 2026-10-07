import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { IssueType, PriorityLevel, ReportItem, ReportMapPoint, ReportStatus } from '../types';
import { stampEvidencePhoto } from './evidencePhotoService';

const buildApiUrl = (path: string) => {
  const configuredBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return configuredBase
    ? `${configuredBase}${normalizedPath}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${normalizedPath}`;
};

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
  wardId?: string;
  wardNumber?: string;
  gpsVerified?: boolean;
  evidencePhotos?: { file: File; capturedAt: string }[];
  photoUrl?: string;
}

export interface ReportEvidencePhoto {
  id: string;
  url: string;
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
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

  async getMapLocations(): Promise<ReportMapPoint[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase
      .from('reports')
      .select('id, report_number, title, issue_type, status, priority, latitude, longitude, ward_name, city, address')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.report_number || row.id,
      issueType: row.issue_type as IssueType,
      issueTitle: row.title || 'Water issue',
      status: row.status as ReportStatus,
      priority: row.priority as PriorityLevel,
      location: {
        ward: row.ward_name || '',
        city: row.city || '',
        latitude: row.latitude ?? undefined,
        longitude: row.longitude ?? undefined,
        address: row.address || undefined,
      },
    }));
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
    const { gpsVerified, wardId, wardName } = dto;
    if (
      !gpsVerified
      || !Number.isFinite(dto.latitude)
      || dto.latitude < -90
      || dto.latitude > 90
      || !Number.isFinite(dto.longitude)
      || dto.longitude < -180
      || dto.longitude > 180
    ) {
      return { success: false, error: 'A fresh, valid GPS fix is required.' };
    }
    if (!dto.evidencePhotos || dto.evidencePhotos.length < 3 || dto.evidencePhotos.length > 5) {
      return { success: false, error: 'Please attach between 3 and 5 evidence photos.' };
    }
    const evidencePhotos = dto.evidencePhotos;
    const reportNumber = `JS-${Math.floor(10000 + Math.random() * 90000)}`;
    let photoUrl = dto.photoUrl;

    const invokeAiAnalysisSafely = async (payload: Record<string, unknown>) => {
      const invokePromise = supabase.functions.invoke('analyze-report', { body: payload });
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI analysis timeout after 12 seconds.')), 12000);
      });

      const result = await Promise.race([invokePromise, timeoutPromise]);
      if (result.error) throw result.error;
      const parsed = result?.data ?? {};
      if (parsed?.success === false || parsed?.error) {
        throw new Error(parsed?.error || 'AI analysis did not complete successfully.');
      }
      return parsed;
    };

    let createdReport: { id: string; report_number: string; [key: string]: unknown } | null = null;
    const uploadedPhotoPaths: string[] = [];
    try {
      const user = await getAuthenticatedCitizenUser();
      if (!user) {
        return { success: false, error: 'You must be signed in to submit a report.' };
      }

      const priority = dto.issueType === 'pipeline_leakage' || dto.issueType === 'no_water' ? 'high' : 'medium';
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
        ward_id: wardId,
        ward_name: wardName,
        city: dto.city || null,
        address: dto.address || null,
        photo_url: dto.photoUrl || null,
      };

      const { data, error } = await supabase.from('reports').insert(insertPayload).select().single();
      if (error || !data) return { success: false, error: error?.message || 'Unable to create report.' };
      createdReport = data;

      let persistedWardNumber = 'Not detected';
      if (data.ward_id) {
        const { data: persistedWard, error: wardLookupError } = await supabase
          .from('wards')
          .select('ward_number')
          .eq('id', data.ward_id)
          .maybeSingle();
        if (wardLookupError) throw new Error(`Unable to confirm the report ward: ${wardLookupError.message}`);
        if (persistedWard?.ward_number) persistedWardNumber = persistedWard.ward_number;
      }
      const stampedPhotos: Blob[] = [];
      for (const photo of evidencePhotos) {
        stampedPhotos.push(await stampEvidencePhoto(photo.file, {
          wardNumber: persistedWardNumber,
          wardName: data.ward_name || 'Not detected',
          latitude: dto.latitude,
          longitude: dto.longitude,
          capturedAt: photo.capturedAt,
          reportId: reportNumber,
        }));
      }

      for (const [index, photo] of evidencePhotos.entries()) {
        const stampedPhoto = stampedPhotos[index];
        const storagePath = `${data.id}/citizen/${Date.now()}-${index}-${Math.random().toString(36).slice(2)}.jpg`;
        const uploaded = await supabase.storage.from('report-photos').upload(
          storagePath,
          stampedPhoto,
          { contentType: 'image/jpeg', upsert: false },
        );
        if (uploaded.error) throw new Error(`Evidence photo ${index + 1} upload failed: ${uploaded.error.message}`);
        uploadedPhotoPaths.push(uploaded.data.path);

        const { error: photoError } = await supabase.from('report_photos').insert({
          report_id: data.id,
          storage_path: uploaded.data.path,
          photo_type: 'evidence',
          file_size: stampedPhoto.size,
          mime_type: 'image/jpeg',
          latitude: dto.latitude,
          longitude: dto.longitude,
          captured_at: photo.capturedAt,
        });
        if (photoError) throw new Error(`Evidence photo ${index + 1} record failed: ${photoError.message}`);
      }

      if (uploadedPhotoPaths.length) {
        const { error: updatePhotoError } = await supabase.from('reports')
          .update({ photo_url: uploadedPhotoPaths[0] })
          .eq('id', data.id);
        if (updatePhotoError) throw new Error(`Unable to link the first evidence photo: ${updatePhotoError.message}`);
        photoUrl = await this.getSignedPhotoUrl(uploadedPhotoPaths[0]);
      }

      try {
        const aiResult = await invokeAiAnalysisSafely({
          reportId: data.id,
          photoUrl,
          issueType: dto.issueType,
          description: dto.description,
          latitude: dto.latitude,
          longitude: dto.longitude,
          wardName: data.ward_name || undefined,
        });

        if (!aiResult?.success) throw new Error('AI analysis did not complete successfully.');
      } catch (edgeError) {
        console.warn('Edge function invoke note:', edgeError);
        const { error: fallbackStatusError } = await supabase.from('reports').update({
          ai_status: 'human_review_required',
          updated_at: new Date().toISOString(),
        }).eq('id', data.id);
        if (fallbackStatusError) console.error('Unable to mark the report for human review after AI analysis failed:', fallbackStatusError);
      }

      return { success: true, report: { ...(await this.mapRowToReport(data)), photoUrl } };
    } catch (error) {
      console.warn('Report submission or evidence processing failed:', error);
      const message = error instanceof Error ? error.message : 'Unable to create report.';
      if (createdReport) {
        try {
          const session = (await supabase.auth.getSession()).data.session;
          if (!session?.access_token) throw new Error('Your login session is unavailable for safe report cleanup.');
          const cleanupResponse = await fetch(buildApiUrl(`/api/citizen/reports/${createdReport.id}/submission`), {
            method: 'DELETE',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          const cleanupResult = await cleanupResponse.json().catch(() => ({})) as { success?: boolean; error?: string };
          if (!cleanupResponse.ok || !cleanupResult.success) {
            throw new Error(cleanupResult.error || `Cleanup request failed (${cleanupResponse.status}).`);
          }
          return {
            success: false,
            error: `Report evidence processing failed and the incomplete report was removed. ${message}`,
          };
        } catch (cleanupError) {
          const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : 'The incomplete report could not be removed.';
          console.error('Incomplete report cleanup did not finish:', cleanupError);
          return {
            success: false,
            report: { ...(await this.mapRowToReport(createdReport)), photoUrl },
            error: `Report ${createdReport.report_number} was created, but evidence processing failed: ${message} Cleanup also failed: ${cleanupMessage} Do not submit it again.`,
          };
        }
      }
      return { success: false, error: message };
    }
  },

  async getEvidencePhotos(reportId: string): Promise<ReportEvidencePhoto[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    let reportUuid = reportId;
    if (!isUuid(reportUuid)) {
      const { data, error } = await supabase.from('reports')
        .select('id')
        .eq('report_number', reportId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return [];
      reportUuid = data.id;
    }

    const { data, error } = await supabase.from('report_photos')
      .select('id, storage_path, captured_at, latitude, longitude')
      .eq('report_id', reportUuid)
      .eq('photo_type', 'evidence')
      .order('captured_at', { ascending: true });
    if (error) throw error;

    if (!data?.length) {
      const { data: report, error: reportError } = await supabase.from('reports')
        .select('photo_url, submitted_at, latitude, longitude')
        .eq('id', reportUuid)
        .maybeSingle();
      if (reportError) throw reportError;
      const url = await this.getSignedPhotoUrl(report?.photo_url);
      return url ? [{
        id: `legacy-${reportUuid}`,
        url,
        capturedAt: report?.submitted_at || undefined,
        latitude: report?.latitude ?? undefined,
        longitude: report?.longitude ?? undefined,
      }] : [];
    }

    return Promise.all((data || []).map(async (photo) => {
      const url = await this.getSignedPhotoUrl(photo.storage_path);
      if (!url) throw new Error(`Unable to create a viewing link for evidence photo ${photo.id}.`);
      return {
        id: photo.id,
        url,
        capturedAt: photo.captured_at || undefined,
        latitude: photo.latitude ?? undefined,
        longitude: photo.longitude ?? undefined,
      };
    }));
  },

  async updateReportStatus(reportId: string, newStatus: ReportStatus, options?: {
    assignedTeamId?: string;
    assignedTeamName?: string;
    reason?: string;
  }): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    if (newStatus === 'rejected') {
      try {
        await this.rejectAndDeleteReport(reportId);
        return true;
      } catch (error) {
        console.error('Failed to permanently delete rejected report:', error);
        return false;
      }
    }

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

  async rejectAndDeleteReport(reportId: string): Promise<void> {
    await this.deleteReportPermanently(reportId, 'admin_rejection');
  },

  async deleteReportPermanently(reportId: string, reason: 'admin_rejection' | 'admin_delete' = 'admin_delete'): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.access_token) throw new Error('You must be signed in as an administrator to reject a report.');

    const response = await fetch(buildApiUrl('/api/admin/delete-report'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ reportId, reason }),
    });

    let result: { success?: boolean; error?: string } = {};
    try {
      result = await response.json();
    } catch {
      throw new Error(`Report deletion failed with HTTP ${response.status}.`);
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Report deletion failed with HTTP ${response.status}.`);
    }
  },

  async updateReportDetails(reportId: string, updates: {
    issueType: IssueType;
    title: string;
    description: string;
    priority: PriorityLevel;
    ward: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
  }): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.access_token) throw new Error('You must be signed in as an administrator to edit a report.');

    const response = await fetch(buildApiUrl(`/api/admin/reports/${encodeURIComponent(reportId)}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(updates),
    });

    let result: { success?: boolean; error?: string } = {};
    try {
      result = await response.json();
    } catch {
      throw new Error(`Report update failed with HTTP ${response.status}.`);
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Report update failed with HTTP ${response.status}.`);
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
      completedAt: row.completed_at || undefined,
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
