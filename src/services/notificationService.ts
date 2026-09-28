import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  async getNotifications(): Promise<AppNotification[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
        createdAt: n.created_at,
      }));
    } catch (error) {
      throw error;
    }
  },

  async markAllRead(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);

      return !error;
    } catch {
      return false;
    }
  },

  async createNotification(payload: {
    userId?: string;
    reportId?: string;
    title: string;
    message: string;
    type?: string;
  }): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: payload.userId,
        report_id: payload.reportId,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'info',
      });
      return !error;
    } catch {
      return false;
    }
  },
};
