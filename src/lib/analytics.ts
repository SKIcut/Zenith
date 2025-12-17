// Analytics tracking - stubbed (events table not available)
export async function trackEvent(eventType: string, payload?: Record<string, any>, userId?: string) {
  // No-op: events table doesn't exist in current schema
  console.debug('[analytics] trackEvent:', eventType, payload);
}

export default trackEvent;