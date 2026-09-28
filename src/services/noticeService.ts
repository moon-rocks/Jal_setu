import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CivicNotice } from '../types';

export const noticeService = {
  async getNotices(): Promise<CivicNotice[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    try {
      const { data, error } = await supabase
        .from('water_notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((n: any) => ({
        id: n.id,
        title: n.title,
        timeWindow: n.time_window,
        severity: n.severity,
        description: n.description,
        ward: n.ward_name,
      }));
    } catch (error) {
      throw error;
    }
  },
};
