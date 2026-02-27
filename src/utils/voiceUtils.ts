import { Priority } from '../types';

export interface ParsedTodo {
  text: string;
  priority: Priority;
  category: string;
  dueDate?: string;
}

const HIGH_WORDS = /\b(urgent|critical|asap|immediately|important|high priority|high-priority)\b/gi;
const LOW_WORDS = /\b(low priority|low-priority|minor|sometime|eventually|whenever)\b/gi;
const CAT_PREFIX = /^(work|personal|shopping|health|home|finance|fitness|family|school|travel)\b:?\s*/i;
const TODAY_RE = /\btoday\b/gi;
const TOMORROW_RE = /\btomorrow\b/gi;
const NEXT_WEEK_RE = /\bnext week\b/gi;
const NEXT_MONTH_RE = /\bnext month\b/gi;

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function parseTodo(transcript: string): ParsedTodo {
  let text = transcript.trim();
  let priority: Priority = 'medium';
  let category = 'General';
  let dueDate: string | undefined;

  if (HIGH_WORDS.test(text)) {
    priority = 'high';
    text = text.replace(HIGH_WORDS, '').trim();
  } else if (LOW_WORDS.test(text)) {
    priority = 'low';
    text = text.replace(LOW_WORDS, '').trim();
  }

  const catMatch = text.match(CAT_PREFIX);
  if (catMatch) {
    category = catMatch[1].charAt(0).toUpperCase() + catMatch[1].slice(1).toLowerCase();
    text = text.slice(catMatch[0].length).trim();
  }

  const now = new Date();
  if (TODAY_RE.test(text)) {
    dueDate = fmtDate(now);
    text = text.replace(TODAY_RE, '').trim();
  } else if (TOMORROW_RE.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    dueDate = fmtDate(d);
    text = text.replace(TOMORROW_RE, '').trim();
  } else if (NEXT_WEEK_RE.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    dueDate = fmtDate(d);
    text = text.replace(NEXT_WEEK_RE, '').trim();
  } else if (NEXT_MONTH_RE.test(text)) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + 1);
    dueDate = fmtDate(d);
    text = text.replace(NEXT_MONTH_RE, '').trim();
  }

  text = text.replace(/\s+/g, ' ').replace(/^[,.\s]+|[,.\s]+$/g, '').trim();
  if (text.length > 0) text = text.charAt(0).toUpperCase() + text.slice(1);

  return { text: text || transcript.trim(), priority, category, dueDate };
}
