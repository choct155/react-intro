import { Todo, Filter } from '../types';

function filterByStatus(todos: Todo[], filter: Filter): Todo[] {
  if (filter === 'active') return todos.filter((t) => !t.completed);
  if (filter === 'completed') return todos.filter((t) => t.completed);
  return todos;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportJSON(todos: Todo[], filter: Filter = 'all'): void {
  const data = filterByStatus(todos, filter);
  downloadFile(JSON.stringify(data, null, 2), 'todos.json', 'application/json');
}

export function exportCSV(todos: Todo[], filter: Filter = 'all'): void {
  const data = filterByStatus(todos, filter);
  const header = 'id,text,completed,priority,category,dueDate,createdAt\n';
  const rows = data
    .map((t) =>
      [
        t.id,
        `"${t.text.replace(/"/g, '""')}"`,
        t.completed,
        t.priority,
        t.category,
        t.dueDate ?? '',
        t.createdAt,
      ].join(',')
    )
    .join('\n');
  downloadFile(header + rows, 'todos.csv', 'text/csv');
}

export function exportText(todos: Todo[], filter: Filter = 'all'): void {
  const data = filterByStatus(todos, filter);
  const lines = data.map((t) => {
    const mark = t.completed ? '☑' : '☐';
    const prio = t.priority !== 'medium' ? ` [${t.priority.toUpperCase()}]` : '';
    const due = t.dueDate ? ` — due ${t.dueDate}` : '';
    const cat = t.category !== 'General' ? ` (${t.category})` : '';
    return `${mark} ${t.text}${prio}${cat}${due}`;
  });
  const header = `Voice Todo Export — ${new Date().toLocaleDateString()}\n${'='.repeat(40)}\n`;
  downloadFile(header + lines.join('\n'), 'todos.txt', 'text/plain');
}

export async function shareList(todos: Todo[], filter: Filter = 'all'): Promise<boolean> {
  if (!navigator.share) return false;
  const data = filterByStatus(todos, filter);
  const text = data.map((t) => `${t.completed ? '✓' : '○'} ${t.text}`).join('\n');
  try {
    await navigator.share({ title: 'My Todo List', text });
    return true;
  } catch {
    return false;
  }
}
