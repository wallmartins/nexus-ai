export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-default border-t-brand-lime" />
        <span className="text-sm text-text-muted">Loading…</span>
      </div>
    </div>
  );
}
