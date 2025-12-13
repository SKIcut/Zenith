import { supabase } from '@/integrations/supabase/client';

export async function trackEvent(eventType: string, payload?: Record<string, any>, userId?: string) {
  try {
    let uid = userId;
    if (!uid) {
      try {
        const { data } = await supabase.auth.getUser();
        uid = data.user?.id ?? null;
      } catch (e) {
        uid = null;
      }
    }

    await supabase.from('events').insert({
      user_id: uid,
      event_type: eventType,
      payload: payload || null,
    });
  } catch (err) {
    // don't block main flow on analytics failures
    // eslint-disable-next-line no-console
    console.warn('trackEvent failed', err);
  }
}

export default trackEvent;
