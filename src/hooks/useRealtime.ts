import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useRealtimeSubscription(
  table: string,
  onEvent: (payload: any) => void,
  filter?: string
) {
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          onEvent(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
}
