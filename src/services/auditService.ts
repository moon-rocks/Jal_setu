import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const auditService = {
  async logAction(action: string, entityType: string, entityId?: string, metadata?: Record<string, any>) {
    if (!isSupabaseConfigured) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        user_id: user ? user.id : null,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata: metadata || {},
      });
    } catch (e) {
      console.warn('Audit logging failed:', e);
    }
  },

  async getRecentLogs(limit = 20) {
    if (!isSupabaseConfigured) return [];
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      return data || [];
    } catch {
      return [];
    }
  },
};
