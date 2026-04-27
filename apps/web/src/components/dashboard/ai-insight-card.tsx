'use client';

import { InsightMiniChart } from './token-chart';
import { Sparkles } from 'lucide-react';

export function AiInsightCard() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-1">
      {/* Purple gradient background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(139,92,246,0.35) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(139,92,246,0.2) 0%, transparent 70%)',
        }}
      />

      {/* Star particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[
          { top: '12%', left: '18%', size: 2, opacity: 0.8 },
          { top: '22%', left: '82%', size: 3, opacity: 0.6 },
          { top: '38%', left: '65%', size: 1.5, opacity: 0.9 },
          { top: '55%', left: '92%', size: 2, opacity: 0.5 },
          { top: '70%', left: '8%', size: 2.5, opacity: 0.7 },
          { top: '85%', left: '75%', size: 1.5, opacity: 0.6 },
        ].map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-full flex-col p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-brand-purple-light" />
            <h3 className="text-sm font-semibold text-text-primary">AI Insight</h3>
            <span className="text-text-muted">·</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-pill border border-border-subtle bg-surface-2/80 px-3 py-1 text-xs text-text-secondary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
            Last 7 days
          </span>
        </div>

        <div className="mb-1">
          <span className="text-5xl font-semibold tracking-tight text-text-primary">78%</span>
          <p className="mt-1 text-sm text-text-muted">Overall system score</p>
        </div>

        <div className="mt-2 flex-1">
          <InsightMiniChart />
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-2/60 p-3">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-purple/20">
            <div className="h-2 w-2 rounded-full bg-brand-purple" />
          </div>
          <p className="text-xs leading-relaxed text-text-secondary">
            Grounding is trending up (+3%). Consider re-running eval-dataset v3 against gpt-4o-mini to validate.
          </p>
        </div>
      </div>
    </div>
  );
}
