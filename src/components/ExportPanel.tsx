import React, { useState } from 'react';
import { Todo, Filter } from '../types';
import { exportJSON, exportCSV, exportText, shareList } from '../utils/exportUtils';

interface Props {
  todos: Todo[];
  onClose: () => void;
}

interface ExportAction {
  label: string;
  desc: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function ExportPanel({ todos, onClose }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [notice, setNotice] = useState('');

  const count =
    filter === 'active'
      ? todos.filter((t) => !t.completed).length
      : filter === 'completed'
      ? todos.filter((t) => t.completed).length
      : todos.length;

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleShare = async () => {
    const ok = await shareList(todos, filter);
    if (!ok) flash('Share not supported on this device/browser.');
  };

  const actions: ExportAction[] = [
    {
      label: 'JSON',
      desc: 'Structured data',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 15v-1h8v1H8zm0 3v-1h5v1H8z" />
        </svg>
      ),
      action: () => exportJSON(todos, filter),
    },
    {
      label: 'CSV',
      desc: 'Spreadsheet format',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
          <path d="M3 9h14V7H3v2zm0 4h14v-2H3v2zm0 4h7v-2H3v2zm11.99-1.13l1.42-1.42 2.13 2.12 4.24-4.24 1.42 1.41-5.66 5.66-3.55-3.53z" />
        </svg>
      ),
      action: () => exportCSV(todos, filter),
    },
    {
      label: 'Plain Text',
      desc: 'Human-readable',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
          <path d="M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z" />
        </svg>
      ),
      action: () => exportText(todos, filter),
    },
    {
      label: 'Share',
      desc: 'Native share sheet',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
        </svg>
      ),
      action: handleShare,
    },
  ];

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-label="Export todos"
    >
      <div className="export-panel">
        <div className="drag-handle" />

        <div className="panel-header">
          <h2 className="panel-title">Export Todos</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="export-filter-row">
          {(['all', 'active', 'completed'] as Filter[]).map((f) => (
            <button
              key={f}
              className={`chip${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <p className="export-count">
          {count} todo{count !== 1 ? 's' : ''} will be exported
        </p>

        <div className="export-grid">
          {actions.map((a) => (
            <button key={a.label} className="export-btn" onClick={a.action}>
              <span className="export-btn-icon">{a.icon}</span>
              <span>
                <div className="export-btn-label">{a.label}</div>
                <div className="export-btn-desc">{a.desc}</div>
              </span>
            </button>
          ))}
        </div>

        {notice && <p className="export-notice">{notice}</p>}
      </div>
    </div>
  );
}
