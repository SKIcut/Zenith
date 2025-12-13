export interface DetectedTask {
  title: string;
  description?: string | null;
  deadline?: string | null;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Heuristic task extractor: finds TODO-style lines, imperative sentences,
 * and explicit "remind me to" / "I need to" statements.
 */
import { supabase } from '@/integrations/supabase/client';

export function extractTasksFromText(text: string): DetectedTask[] {
  if (!text) return [];
  const tasks: DetectedTask[] = [];
  const seen = new Set<string>();
  const lower = text.toLowerCase();

  // Match markdown task list items: - [ ] do something
  const todoPattern = /[-*]\s*\[.?\]\s*(.+)/g;
  let m;
  while ((m = todoPattern.exec(text)) !== null) {
    const title = m[1].trim();
    if (title && !seen.has(title)) {
      seen.add(title);
      tasks.push({ title, priority: 'normal' });
    }
  }

  // Lines that start with TODO: or FIXME:
  const todoMarker = /(?:todo|fixme)[:\-]\s*(.+)/gi;
  while ((m = todoMarker.exec(text)) !== null) {
    const title = m[1].trim();
    if (title && !seen.has(title)) {
      seen.add(title);
      tasks.push({ title, priority: 'normal' });
    }
  }

  // "Remind me to <action>" or "Remember to <action>"
  const remindPattern = /(?:remind me to|remember to|don't forget to|dont forget to)\s+([^.!?\n]+)/gi;
  while ((m = remindPattern.exec(text)) !== null) {
    const raw = m[1].trim();
    const title = raw.replace(/["'`]+/g, '');
    if (title && !seen.has(title)) {
      seen.add(title);
      tasks.push({ title, priority: 'normal' });
    }
  }

  // "I need to", "I should", "I must", "I have to" -> treat following clause as a task
  const needPattern = /(?:i need to|i should|i must|i have to|i'll|i will)\s+([^.!?\n]+)/gi;
  while ((m = needPattern.exec(text)) !== null) {
    const title = m[1].trim();
    if (title && title.length > 3 && !seen.has(title)) {
      seen.add(title);
      tasks.push({ title, priority: 'normal' });
    }
  }

  // Imperative sentences that end with a period or linebreak
  // e.g. "Schedule a call with Anna." We'll take short imperatives (<=100 chars)
  const imperativePattern = /(^|\.|\n)\s*([A-Z][a-z]+\s+[a-zA-Z0-9\s\-:,]{3,100}?)\s*(?:\.|\n|$)/g;
  // crude filter: look for verbs at start like "Schedule", "Call", "Write"
  const verbs = ['schedule','call','write','email','follow up','research','create','book','prepare','review','finish','complete','deploy','build','design','test'];
  while ((m = imperativePattern.exec(text)) !== null) {
    const candidate = m[2].trim();
    const candLower = candidate.toLowerCase();
    for (const v of verbs) {
      if (candLower.startsWith(v) && candidate.length < 140 && !seen.has(candidate)) {
        seen.add(candidate);
        tasks.push({ title: candidate, priority: 'normal' });
        break;
      }
    }
  }

  return tasks;
}

// Persist detected tasks to Supabase for the authenticated user
export async function saveDetectedTasks(text: string, sourceText?: string) {
  const tasks = extractTasksFromText(text);
  if (!tasks.length) return [];

  try {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) throw new Error('Not authenticated');

    const inserts = tasks.map(t => ({
      user_id: uid,
      title: t.title,
      description: t.description || null,
      source_text: sourceText || text,
      confidence: null,
    }));

    const { error } = await supabase.from('detected_tasks').insert(inserts);
    if (error) throw error;
    return inserts;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('saveDetectedTasks failed', err);
    return [];
  }
}
