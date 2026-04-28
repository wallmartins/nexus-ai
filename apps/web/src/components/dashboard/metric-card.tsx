import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from 'lucide-react';

type MetricCardProps = {
  label: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  variant?: 'featured' | 'default';
  delta?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
};

function DeltaChip({ delta, featured }: { delta: MetricCardProps['delta']; featured?: boolean }) {
  if (!delta) return null;

  const isPositive = delta.direction === 'up';
  const isNegative = delta.direction === 'down';

  const bg = featured
    ? isPositive
      ? 'bg-bg-canvas/20 text-bg-canvas'
      : isNegative
        ? 'bg-bg-canvas/20 text-bg-canvas'
        : 'bg-bg-canvas/20 text-bg-canvas'
    : isPositive
      ? 'bg-brand-lime/15 text-brand-lime'
      : isNegative
        ? 'bg-status-danger/15 text-status-danger'
        : 'bg-surface-3 text-text-muted';

  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${bg}`}
    >
      <Icon size={12} />
      {delta.value}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  delta,
}: MetricCardProps) {
  if (variant === 'featured') {
    return (
      <div className="relative flex flex-col justify-between rounded-lg bg-brand-lime p-5 text-bg-canvas">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-canvas/15">
              <Icon size={14} />
            </div>
            <span className="text-sm font-medium">{label}</span>
          </div>
          <ArrowUpRight size={16} className="opacity-60" />
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-semibold tracking-tight">{value}</span>
            {delta && <DeltaChip delta={delta} featured />}
          </div>
          <p className="mt-1 text-xs opacity-70">{subtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col justify-between rounded-lg border border-border-subtle bg-surface-1 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-text-muted">
            <Icon size={14} />
          </div>
          <span className="text-sm font-medium text-text-secondary">{label}</span>
        </div>
        <ArrowUpRight size={16} className="text-text-muted opacity-40" />
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <span className="text-4xl font-semibold tracking-tight text-text-primary">{value}</span>
          {delta && <DeltaChip delta={delta} />}
        </div>
        <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
      </div>
    </div>
  );
}
