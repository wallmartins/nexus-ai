'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-canvas px-6">
      <div className="w-full max-w-md rounded-lg border border-border-subtle bg-surface-1 p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-text-primary">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-text-muted">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-brand-lime px-4 py-2 text-sm font-medium text-bg-canvas transition-colors hover:bg-brand-lime-hover"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
