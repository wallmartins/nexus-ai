import Link from 'next/link';

export function TopNav() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border-subtle bg-bg-canvas px-6 lg:px-8">
      <div className="hidden items-center gap-2 lg:flex">
        <span className="text-sm font-medium text-text-muted">
          Grounded answers from your knowledge base
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/settings"
          className="flex h-9 items-center justify-center rounded-md border border-border-subtle bg-surface-1 px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
        >
          Settings
        </Link>
      </div>
    </header>
  );
}
