import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CivicNotice } from '../types';

export type NoticeSeverity = CivicNotice['severity'];

export interface NoticeInput {
  title: string;
  description: string;
  timeWindow: string;
  severity: NoticeSeverity;
  wardId?: string;
  isActive: boolean;
}

export interface MunicipalWard {
  id: string;
  ward_number: string;
  ward_name: string;
}

interface WaterNoticeRecord {
  id: string;
  title: string;
  time_window: string;
  severity: NoticeSeverity;
  description: string;
  ward_id: string | null;
  ward?: { ward_name: string; ward_number: string } | { ward_name: string; ward_number: string }[] | null;
  is_active: boolean;
  created_at: string;
}

const mapNotice = (notice: WaterNoticeRecord): CivicNotice => {
  const ward = Array.isArray(notice.ward) ? notice.ward[0] : notice.ward;
  return {
    id: notice.id,
    title: notice.title,
    timeWindow: notice.time_window,
    severity: notice.severity,
    description: notice.description,
    ward: ward?.ward_name || (ward?.ward_number ? `Ward ${ward.ward_number}` : undefined),
    wardId: notice.ward_id || undefined,
    isActive: notice.is_active,
    createdAt: notice.created_at,
  };
};

const ensureConfigured = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }
};

export const noticeService = {
  async getWards(): Promise<MunicipalWard[]> {
    ensureConfigured();

    const { data, error } = await supabase
      .from('wards')
      .select('id, ward_number, ward_name')
      .order('ward_number', { ascending: true });

    if (error) throw error;
    return (data || []) as MunicipalWard[];
  },

  async getNotices(): Promise<CivicNotice[]> {
    ensureConfigured();

    const { data, error } = await supabase
      .from('water_notices')
      .select('id, title, time_window, severity, description, ward_id, ward:wards(ward_name, ward_number), is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((notice: WaterNoticeRecord) => mapNotice(notice));
  },

  async getAdminNotices(): Promise<CivicNotice[]> {
    ensureConfigured();

    const { data, error } = await supabase
      .from('water_notices')
      .select('id, title, time_window, severity, description, ward_id, ward:wards(ward_name, ward_number), is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((notice: WaterNoticeRecord) => mapNotice(notice));
  },

  async createNotice(input: NoticeInput): Promise<CivicNotice> {
    ensureConfigured();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('water_notices')
      .insert({
        title: input.title.trim(),
        description: input.description.trim(),
        time_window: input.timeWindow.trim(),
        severity: input.severity,
        ward_id: input.wardId || null,
        is_active: input.isActive,
        published_by: user?.id || null,
      })
      .select('id, title, time_window, severity, description, ward_id, ward:wards(ward_name, ward_number), is_active, created_at')
      .single();

    if (error) throw error;
    return mapNotice(data as WaterNoticeRecord);
  },

  async updateNotice(id: string, input: NoticeInput): Promise<void> {
    ensureConfigured();

    const { error } = await supabase
      .from('water_notices')
      .update({
        title: input.title.trim(),
        description: input.description.trim(),
        time_window: input.timeWindow.trim(),
        severity: input.severity,
        ward_id: input.wardId || null,
        is_active: input.isActive,
      })
      .eq('id', id);

    if (error) throw error;
  },

  async setNoticePublished(id: string, isActive: boolean): Promise<void> {
    ensureConfigured();

    const { error } = await supabase
      .from('water_notices')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteNotice(id: string): Promise<void> {
    ensureConfigured();

    const { error } = await supabase
      .from('water_notices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
