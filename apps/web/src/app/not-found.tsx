export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <h2 className="mb-2 text-2xl font-semibold text-text-primary">Page not found</h2>
      <p className="mb-6 text-text-muted">
        The page you are looking for does not exist.
      </p>
      <a
        href="/"
        className="inline-flex items-center justify-center rounded-md bg-brand-lime px-4 py-2 text-sm font-medium text-bg-canvas transition-colors hover:bg-brand-lime-hover"
      >
        Go home
      </a>
    </div>
  );
}
