'use client';

import { useState } from 'react';
import { type LogEntry } from '@/lib/api';
import { Search, Filter, Copy, Check } from 'lucide-react';

type RequestLogTableProps = {
  logs: LogEntry[];
  onSelect: (log: LogEntry) => void;
};

function levelColor(level: string): string {
  switch (level) {
    case 'error': return 'text-status-danger';
    case 'warn': return 'text-status-warning';
    case 'info': return 'text-status-success';
    default: return 'text-text-muted';
  }
}

export function RequestLogTable({ logs, onSelect }: RequestLogTableProps) {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.correlationId.toLowerCase().includes(search.toLowerCase()) ||
      log.eventType.toLowerCase().includes(search.toLowerCase()) ||
      log.service.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = !levelFilter || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  async function copyCorrelationId(id: string) {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-border-subtle bg-surface-1">
      <div className="flex items-center gap-3 border-b border-border-subtle p-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search correlation ID, event, service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border-subtle bg-surface-2 py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-text-muted" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-md border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary focus:border-border-strong focus:outline-none"
          >
            <option value="">All levels</option>
            <option value="info">info</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
            <option value="debug">debug</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-surface-1">
            <tr className="border-b border-border-subtle text-text-muted">
              <th className="px-4 py-2 font-medium">Level</th>
              <th className="px-4 py-2 font-medium">Service</th>
              <th className="px-4 py-2 font-medium">Event</th>
              <th className="px-4 py-2 font-medium">Correlation ID</th>
              <th className="px-4 py-2 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr
                key={log.id}
                onClick={() => onSelect(log)}
                className="cursor-pointer border-b border-border-subtle transition-colors hover:bg-surface-2"
              >
                <td className={`px-4 py-2 font-mono text-xs font-medium ${levelColor(log.level)}`}>
                  {log.level}
                </td>
                <td className="px-4 py-2 text-text-secondary">{log.service}</td>
                <td className="px-4 py-2 text-text-secondary">{log.eventType}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-text-muted">{log.correlationId}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); void copyCorrelationId(log.correlationId); }}
                      className="rounded p-1 text-text-muted hover:bg-surface-3 hover:text-text-primary"
                      title="Copy correlation ID"
                    >
                      {copiedId === log.correlationId ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-text-muted">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  No logs match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
