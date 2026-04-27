import { type ReactNode } from 'react';

type ScoreCardProps = {
  label: string;
  score: number;
  icon: ReactNode;
  format?: 'percent' | 'ms';
};

export function ScoreCard({ label, score, icon, format = 'percent' }: ScoreCardProps) {
  const display = format === 'ms' ? `${Math.round(score)} ms` : `${(score * 100).toFixed(1)}%`;

  let barColor = 'bg-status-danger';
  if (score >= 0.8) barColor = 'bg-status-success';
  else if (score >= 0.6) barColor = 'bg-status-warning';

  return (
    <div className="rounded-md border border-border-subtle bg-surface-2 p-3">
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 text-xl font-semibold text-text-primary">{display}</p>
      {format === 'percent' && (
        <div className="mt-2 h-1 w-full rounded-full bg-surface-3">
          <div
            className={`h-1 rounded-full ${barColor}`}
            style={{ width: `${Math.min(score * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
