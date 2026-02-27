import React, { useState, useEffect, useCallback } from 'react';
import { Todo, Priority, Filter, SortBy } from '../types';
import { loadTodos, saveTodos } from '../utils/storage';
import { ParsedTodo } from '../utils/voiceUtils';
import TodoItem from './TodoItem';
import VoiceInput from './VoiceInput';
import ExportPanel from './ExportPanel';

interface Props {
  onLock: () => void;
}

const CATEGORIES = [
  'General', 'Work', 'Personal', 'Shopping', 'Health',
  'Home', 'Finance', 'Fitness', 'Family', 'School', 'Travel',
];

const PRIO_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function TodoApp({ onLock }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [showVoice, setShowVoice] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [addText, setAddText] = useState('');
  const [addPriority, setAddPriority] = useState<Priority>('medium');
  const [addCategory, setAddCategory] = useState('General');

  useEffect(() => {
    setTodos(loadTodos());
  }, []);

  const addTodo = useCallback(
    (text: string, priority: Priority = 'medium', category = 'General', dueDate?: string) => {
      if (!text.trim()) return;
      const todo: Todo = {
        id: genId(),
        text: text.trim(),
        completed: false,
        priority,
        category,
        dueDate,
        createdAt: new Date().toISOString(),
      };
      setTodos((prev) => {
        const next = [todo, ...prev];
        saveTodos(next);
        return next;
      });
      if (navigator.vibrate) navigator.vibrate(50);
    },
    []
  );

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      saveTodos(next);
      return next;
    });
    if (navigator.vibrate) navigator.vibrate(30);
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTodos(next);
      return next;
    });
  }, []);

  const handleTextAdd = () => {
    if (!addText.trim()) return;
    addTodo(addText, addPriority, addCategory);
    setAddText('');
    setAddPriority('medium');
    setAddCategory('General');
    setShowForm(false);
  };

  const handleVoiceConfirm = (parsed: ParsedTodo) => {
    addTodo(parsed.text, parsed.priority, parsed.category, parsed.dueDate);
    setShowVoice(false);
  };

  const filtered = todos
    .filter((t) => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority];
      if (sortBy === 'alpha') return a.text.localeCompare(b.text);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const activeCnt = todos.filter((t) => !t.completed).length;

  return (
    <div className="todo-app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Voice Todo</h1>
          {activeCnt > 0 && <span className="active-badge">{activeCnt}</span>}
        </div>
        <div className="header-right">
          <button className="icon-btn" onClick={() => setShowExport(true)} aria-label="Export">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
          </button>
          <button className="icon-btn" onClick={onLock} aria-label="Lock">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Filter / Sort Bar ── */}
      <div className="filter-bar">
        <div className="filter-tabs">
          {(['all', 'active', 'completed'] as Filter[]).map((f) => (
            <button
              key={f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          aria-label="Sort by"
        >
          <option value="created">Newest</option>
          <option value="priority">Priority</option>
          <option value="alpha">A–Z</option>
        </select>
      </div>

      {/* ── Todo List ── */}
      <main className="todo-list-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="currentColor" width="56" height="56" aria-hidden="true">
              <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            <p>
              {filter === 'completed'
                ? 'No completed todos yet'
                : 'No todos yet — use + or the mic below!'}
            </p>
          </div>
        ) : (
          <ul className="todo-list">
            {filtered.map((todo) => (
              <li key={todo.id}>
                <TodoItem todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* ── Add Form (slides up) ── */}
      {showForm && (
        <div className="add-form">
          <textarea
            className="add-textarea"
            placeholder="What needs to be done?"
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            rows={2}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextAdd(); }
              if (e.key === 'Escape') { setShowForm(false); setAddText(''); }
            }}
          />
          <div className="add-meta-row">
            <select
              className="meta-select"
              value={addPriority}
              onChange={(e) => setAddPriority(e.target.value as Priority)}
            >
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <select
              className="meta-select"
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="add-form-actions">
            <button
              className="btn-secondary"
              onClick={() => { setShowForm(false); setAddText(''); }}
            >
              Cancel
            </button>
            <button className="btn-primary" onClick={handleTextAdd} disabled={!addText.trim()}>
              Add
            </button>
          </div>
        </div>
      )}

      {/* ── FABs ── */}
      <div className="fab-area">
        <button className="fab fab-mic" onClick={() => setShowVoice(true)} aria-label="Add by voice">
          <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26" aria-hidden="true">
            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
          </svg>
        </button>
        <button
          className="fab fab-add"
          onClick={() => setShowForm((v) => !v)}
          aria-label="Type a todo"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" aria-hidden="true">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
      </div>

      {/* ── Overlays ── */}
      {showVoice && (
        <VoiceInput onConfirm={handleVoiceConfirm} onCancel={() => setShowVoice(false)} />
      )}
      {showExport && <ExportPanel todos={todos} onClose={() => setShowExport(false)} />}
    </div>
  );
}
