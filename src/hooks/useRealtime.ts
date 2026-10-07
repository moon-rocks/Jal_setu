import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useRealtimeSubscription(
  table: string,
  onEvent: (payload: any) => void,
  filter?: string
) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

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
          callbackRef.current(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
}
