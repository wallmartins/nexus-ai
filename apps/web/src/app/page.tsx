export default function HomePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="text-center">
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-text-primary">
          Nexus AI
        </h1>
        <p className="mb-8 max-w-md text-text-secondary">
          Grounded answers from your knowledge base. Upload documents, chat
          with citations, and observe your RAG pipeline in real time.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/chat"
            className="inline-flex items-center justify-center rounded-md bg-brand-lime px-5 py-2.5 text-sm font-medium text-bg-canvas transition-colors hover:bg-brand-lime-hover"
          >
            Start chatting
          </a>
          <a
            href="/documents"
            className="inline-flex items-center justify-center rounded-md border border-border-subtle bg-surface-1 px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-2"
          >
            Upload documents
          </a>
        </div>
      </div>
    </div>
  );
}
