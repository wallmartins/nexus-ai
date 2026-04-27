'use client';

import { ArrowRight } from 'lucide-react';

type TimelineEvent = {
  time: string;
  title: string;
  avatar: string;
  color: string;
  textColor?: string;
  featured: boolean;
};

const TIMELINE_EVENTS: TimelineEvent[] = [];

const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00'];

export function TimelineCard() {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border-subtle bg-surface-1 p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Recent agent runs</h3>
          <p className="mt-0.5 text-lg font-semibold text-text-primary">Today&apos;s timeline</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-pill border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
        >
          View all
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Timeline axis */}
      <div className="relative mb-4 mt-2">
        <div className="flex justify-between text-[10px] text-text-muted">
          {HOURS.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        <div className="relative mt-2 h-px bg-border-subtle">
          {HOURS.map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-text-muted"
              style={{ left: `${(i / (HOURS.length - 1)) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Event cards */}
      {TIMELINE_EVENTS.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border-subtle">
          <p className="text-xs text-text-muted">No recent activity</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TIMELINE_EVENTS.map((event) => (
            <div
              key={event.time}
              className={`flex flex-col gap-2 rounded-lg border p-3 ${
                event.featured
                  ? 'border-brand-lime/30 bg-brand-lime/10'
                  : 'border-border-subtle bg-surface-2/50'
              }`}
            >
              <span className="text-[10px] text-text-muted">{event.time}</span>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${event.color} ${
                    event.textColor ?? 'text-white'
                  }`}
                >
                  {event.avatar}
                </div>
                <span className="text-xs font-medium text-text-secondary">{event.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
