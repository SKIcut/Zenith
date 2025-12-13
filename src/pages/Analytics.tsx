import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Analytics() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data: types } = await supabase
          .from('events')
          .select('event_type, count:count(*)')
          .group('event_type');

        // fallback: simple aggregation if the grouped select above doesn't work
        if (!types) {
          const { data } = await supabase.from('events').select('event_type');
          const map: Record<string, number> = {};
          (data || []).forEach((r: any) => { map[r.event_type] = (map[r.event_type] || 0) + 1; });
          if (mounted) setCounts(map);
        } else {
          const map: Record<string, number> = {};
          (types as any[]).forEach((t: any) => { map[t.event_type] = Number(t.count) || 0; });
          if (mounted) setCounts(map);
        }

        const { data: recentEvents } = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(20);
        if (mounted) setRecent(recentEvents || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('analytics load failed', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-xl font-bold">Analytics (Self-hosted)</span>
          </div>
        </div>
        {loading ? <p>Loading…</p> : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {Object.entries(counts).map(([k, v]) => (
                <div key={k} className="p-4 bg-card rounded-lg border border-glass">
                  <div className="text-sm text-muted-foreground">{k}</div>
                  <div className="text-2xl font-semibold">{v}</div>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-medium mb-2">Recent events</h3>
            <div className="space-y-2">
              {recent.map((r: any) => (
                <div key={r.id} className="p-3 bg-muted/30 rounded-lg border border-glass/50">
                  <div className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                  <div className="font-medium mt-1">{r.event_type}</div>
                  <pre className="text-xs mt-1 whitespace-pre-wrap">{JSON.stringify(r.payload)}</pre>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
