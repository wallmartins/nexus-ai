type MetricCardProps = {
  label: string;
  value: number;
  format: 'number' | 'ms' | 'percent';
};

function formatValue(value: number, format: MetricCardProps['format']): string {
  if (format === 'ms') return `${Math.round(value).toLocaleString()} ms`;
  if (format === 'percent') return `${(value * 100).toFixed(2)}%`;
  return value.toLocaleString();
}

export function MetricCard({ label, value, format }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-text-primary">{formatValue(value, format)}</p>
    </div>
  );
}
