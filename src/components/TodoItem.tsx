import React, { useState } from 'react';
import { Todo, Priority } from '../types';

interface Props {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const PRIO_COLOR: Record<Priority, string> = {
  high: '#ff5252',
  medium: '#ffab40',
  low: '#69f0ae',
};

function formatDue(dateStr: string): { label: string; overdue: boolean } {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return { label: 'Today', overdue: false };
  if (diff === 1) return { label: 'Tomorrow', overdue: false };
  if (diff === -1) return { label: 'Yesterday', overdue: true };
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff < 7) return { label: `In ${diff} days`, overdue: false };
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false };
}

export default function TodoItem({ todo, onToggle, onDelete }: Props) {
  const [confirm, setConfirm] = useState(false);
  const due = todo.dueDate ? formatDue(todo.dueDate) : null;

  return (
    <div className={`todo-item${todo.completed ? ' todo-completed' : ''}`}>
      <div className="todo-prio-bar" style={{ backgroundColor: PRIO_COLOR[todo.priority] }} />

      <button
        className={`todo-checkbox${todo.completed ? ' checked' : ''}`}
        onClick={() => onToggle(todo.id)}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {todo.completed && (
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      <div className="todo-body">
        <span className="todo-text">{todo.text}</span>
        <div className="todo-meta">
          {todo.category !== 'General' && (
            <span className="todo-tag todo-cat">{todo.category}</span>
          )}
          {due && (
            <span className={`todo-tag todo-due${due.overdue ? ' overdue' : ''}`}>
              {due.label}
            </span>
          )}
          <span className={`todo-tag todo-prio todo-prio-${todo.priority}`}>
            {todo.priority}
          </span>
        </div>
      </div>

      {confirm ? (
        <div className="todo-confirm">
          <button className="btn-del-confirm" onClick={() => onDelete(todo.id)}>
            Delete
          </button>
          <button className="btn-del-cancel" onClick={() => setConfirm(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="todo-del-btn"
          onClick={() => setConfirm(true)}
          aria-label="Delete todo"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
