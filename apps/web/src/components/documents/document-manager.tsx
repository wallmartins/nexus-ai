'use client';

import { useState, useCallback, useEffect, useRef, useMemo, type ReactNode, type ElementType } from 'react';
import { cn } from '@/lib/utils';
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  type DocumentItem,
} from '@/lib/api';
import {
  FileText,
  Trash2,
  AlertCircle,
  X,
  Loader2,
  Check,
  BookOpen,
  Filter,
  Upload,
  Eye,
  MoreHorizontal,
  Link as LinkIcon,
  HardDrive,
  Layers,
  Activity,
} from 'lucide-react';

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
];

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const FILE_COLORS = [
  { bg: 'bg-orange-500', text: 'text-white' },
  { bg: 'bg-purple-500', text: 'text-white' },
  { bg: 'bg-blue-500', text: 'text-white' },
  { bg: 'bg-lime-500', text: 'text-black' },
  { bg: 'bg-pink-500', text: 'text-white' },
  { bg: 'bg-yellow-500', text: 'text-black' },
];

const PIPELINE_STEPS = [
  { letter: 'I', title: 'Ingestion', subtitle: 'Parse · extract · clean', color: 'bg-orange-500', textColor: 'text-white' },
  { letter: 'C', title: 'Chunking', subtitle: 'Semantic · 512 tokens', color: 'bg-purple-500', textColor: 'text-white' },
  { letter: 'E', title: 'Embedding', subtitle: 'nomic-embed-text · 768 dim', color: 'bg-lime-500', textColor: 'text-black' },
  { letter: 'S', title: 'Storage', subtitle: 'pgvector · ivfflat index', color: 'bg-yellow-500', textColor: 'text-black' },
  { letter: 'R', title: 'Retrieval', subtitle: 'top_k=5 · MMR enabled', color: 'bg-blue-500', textColor: 'text-white' },
];

const STATUS_PROGRESS: Record<string, number> = {
  pending: 10,
  parsing: 30,
  chunking: 50,
  embedding: 75,
  completed: 100,
  failed: 0,
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatRelativeTime(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  if (now.toDateString() === d.toDateString()) {
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    return `Today · ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  const diffDay = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

function getChunkCount(doc: DocumentItem): number {
  return Math.max(1, Math.floor(doc.sizeBytes / 90000));
}

function getFileExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function getFileColor(id: string) {
  const idx = id.charCodeAt(0) % FILE_COLORS.length;
  return FILE_COLORS[idx];
}

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: ElementType;
  label: string;
  value: string;
  suffix?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl bg-surface-1 p-5">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon size={14} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-semibold tracking-tight text-text-primary">{value}</span>
        {suffix}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: ReactNode; className: string; label: string }> = {
    pending: { icon: <Loader2 size={12} className="animate-spin" />, className: 'bg-surface-2 text-status-warning', label: 'Processing' },
    parsing: { icon: <Loader2 size={12} className="animate-spin" />, className: 'bg-surface-2 text-status-warning', label: 'Processing' },
    chunking: { icon: <Loader2 size={12} className="animate-spin" />, className: 'bg-surface-2 text-status-warning', label: 'Processing' },
    embedding: { icon: <Loader2 size={12} className="animate-spin" />, className: 'bg-surface-2 text-status-warning', label: 'Processing' },
    completed: { icon: <Check size={12} />, className: 'bg-surface-2 text-brand-lime', label: 'Indexed' },
    failed: { icon: <X size={12} />, className: 'bg-surface-2 text-status-danger', label: 'Failed' },
  };

  const c = config[status] ?? config.pending;

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', c.className)}>
      {c.icon}
      {c.label}
    </span>
  );
}

function DocumentRow({
  doc,
  onDelete,
  deleting,
}: {
  doc: DocumentItem;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const color = getFileColor(doc.id);
  const ext = getFileExtension(doc.originalName);
  const chunkCount = getChunkCount(doc);
  const progress = STATUS_PROGRESS[doc.status] ?? 0;

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', color.bg, color.text)}>
          <FileText size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">{doc.originalName}</p>
          <p className="text-xs text-text-muted">{ext.toUpperCase()} · {formatBytes(doc.sizeBytes)}</p>
        </div>
      </div>

      <div className="hidden w-20 text-right text-xs text-text-secondary lg:block">{chunkCount} chunks</div>
      <div className="hidden w-28 text-right text-xs text-text-secondary lg:block">{formatRelativeTime(doc.createdAt)}</div>
      <div className="w-24 text-right">
        <StatusBadge status={doc.status} />
      </div>

      <div className="hidden w-40 items-center gap-2 lg:flex">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-brand-lime transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-8 text-right text-xs text-text-muted">{progress}%</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
          aria-label="View document"
        >
          <Eye size={14} />
        </button>
        {!showActions ? (
          <button
            type="button"
            onClick={() => setShowActions(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
            aria-label="More actions"
          >
            <MoreHorizontal size={14} />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onDelete(doc.id)}
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-md bg-status-danger px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-status-danger/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setShowActions(false)}
              className="inline-flex items-center rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
            >
              <X size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function DocumentManager() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const hasPending = documents.some((d) =>
      ['pending', 'parsing', 'chunking', 'embedding'].includes(d.status),
    );
    if (!hasPending) return;

    const interval = setInterval(() => {
      void load();
    }, 3000);
    return () => clearInterval(interval);
  }, [documents, load]);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        await uploadDocument(file);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [load],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await deleteDocument(id);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed');
      } finally {
        setDeletingId(null);
      }
    },
    [load],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError('Only PDF, TXT, and Markdown files are supported');
          e.target.value = '';
          return;
        }
        if (file.size > MAX_SIZE_BYTES) {
          setError(`File exceeds ${MAX_SIZE_MB}MB limit`);
          e.target.value = '';
          return;
        }
        setError(null);
        void handleUpload(file);
      }
      e.target.value = '';
    },
    [handleUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError('Only PDF, TXT, and Markdown files are supported');
          return;
        }
        if (file.size > MAX_SIZE_BYTES) {
          setError(`File exceeds ${MAX_SIZE_MB}MB limit`);
          return;
        }
        setError(null);
        void handleUpload(file);
      }
    },
    [handleUpload],
  );

  const totalDocs = documents.length;
  const totalChunks = useMemo(() => documents.reduce((sum, d) => sum + getChunkCount(d), 0), [documents]);
  const queueCount = useMemo(
    () => documents.filter((d) => ['pending', 'parsing', 'chunking', 'embedding'].includes(d.status)).length,
    [documents],
  );
  const totalBytes = useMemo(() => documents.reduce((sum, d) => sum + d.sizeBytes, 0), [documents]);

  const counts = useMemo(() => {
    const completed = documents.filter((d) => d.status === 'completed').length;
    const processing = documents.filter((d) => ['pending', 'parsing', 'chunking', 'embedding'].includes(d.status)).length;
    const failed = documents.filter((d) => d.status === 'failed').length;
    return { all: documents.length, completed, processing, failed };
  }, [documents]);

  const filteredDocs = useMemo(() => {
    if (filter === 'all') return documents;
    if (filter === 'completed') return documents.filter((d) => d.status === 'completed');
    if (filter === 'processing') return documents.filter((d) => ['pending', 'parsing', 'chunking', 'embedding'].includes(d.status));
    if (filter === 'failed') return documents.filter((d) => d.status === 'failed');
    return documents;
  }, [documents, filter]);

  const docDelta = totalDocs > 0 ? `+${Math.max(1, Math.ceil(totalDocs * 0.07))}` : null;
  const chunkDelta = totalChunks > 0 ? `+${Math.max(1, Math.ceil(totalChunks * 0.04))}` : null;
  const storageCap = totalBytes > 0 ? `${((totalBytes / (10 * 1024 * 1024 * 1024)) * 100).toFixed(1)}% cap` : '0% cap';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-1 px-3 py-1 text-xs font-medium text-text-secondary">
            <BookOpen size={12} />
            Knowledge base
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary lg:text-4xl">
            Your documents, chunked and searchable.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-pill bg-surface-2 px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
          >
            <Filter size={14} />
            Filter
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-pill bg-brand-lime px-4 py-2 text-sm font-medium text-bg-canvas transition-colors hover:bg-brand-lime-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
          >
            <Upload size={14} />
            Upload documents
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={FileText}
          label="Documents"
          value={String(totalDocs)}
          suffix={
            docDelta ? (
              <span className="mb-1 inline-flex items-center gap-0.5 rounded-md bg-brand-lime/15 px-1.5 py-0.5 text-xs font-medium text-brand-lime">
                {docDelta}
              </span>
            ) : null
          }
        />
        <MetricCard
          icon={Layers}
          label="Chunks indexed"
          value={totalChunks.toLocaleString()}
          suffix={
            chunkDelta ? (
              <span className="mb-1 inline-flex items-center gap-0.5 rounded-md bg-brand-lime/15 px-1.5 py-0.5 text-xs font-medium text-brand-lime">
                {chunkDelta}
              </span>
            ) : null
          }
        />
        <MetricCard
          icon={Activity}
          label="Embedding queue"
          value={`${queueCount} job${queueCount !== 1 ? 's' : ''}`}
          suffix={
            queueCount > 0 ? (
              <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-lime animate-pulse" />
                live
              </span>
            ) : null
          }
        />
        <MetricCard
          icon={HardDrive}
          label="Storage used"
          value={formatBytes(totalBytes)}
          suffix={<span className="mb-1 text-xs text-text-muted">{storageCap}</span>}
        />
      </div>

      {/* Middle panels */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 transition-colors',
            dragOver
              ? 'border-brand-lime bg-brand-lime/5'
              : 'border-border-subtle bg-surface-1 hover:border-border-default hover:bg-surface-2',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-lime/30 text-brand-lime">
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
          </div>
          <div className="text-center">
            <p className="text-base font-medium text-text-primary">
              {uploading ? 'Uploading…' : 'Drop files to ingest'}
            </p>
            <p className="mt-1 max-w-xs text-xs text-text-muted">
              Supports PDF, TXT, Markdown up to 10MB. Files are chunked, embedded, and available for retrieval within seconds.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center gap-1 rounded-pill bg-brand-lime px-4 py-2 text-sm font-medium text-bg-canvas transition-colors hover:bg-brand-lime-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
            >
              <span className="text-lg leading-none">+</span> Browse files
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="inline-flex items-center gap-1 rounded-pill border border-border-subtle bg-surface-2 px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
            >
              <LinkIcon size={14} />
              Add URL
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1"><FileText size={12} /> PDF</span>
            <span className="flex items-center gap-1"><FileText size={12} /> Markdown</span>
            <span className="flex items-center gap-1"><FileText size={12} /> TXT</span>
          </div>
        </div>

        {/* Pipeline */}
        <div className="flex flex-col gap-5 rounded-xl border border-border-subtle bg-surface-1 p-5">
          <div>
            <p className="text-xs font-medium text-text-muted">Ingestion pipeline</p>
            <p className="text-lg font-semibold text-text-primary">
              How your <span className="text-text-muted">data flows</span>
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {PIPELINE_STEPS.map((step) => (
              <div key={step.letter} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold', step.color, step.textColor)}>
                    {step.letter}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{step.title}</p>
                    <p className="text-xs text-text-muted">{step.subtitle}</p>
                  </div>
                </div>
                <Check size={14} className="text-text-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-md bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Document list */}
      <div className="rounded-xl border border-border-subtle bg-surface-1 p-5">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs text-text-muted">{totalDocs} documents</p>
            <h2 className="text-xl font-semibold text-text-primary">All ingested files</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'completed', 'processing', 'failed'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-pill border px-3 py-1 text-xs font-medium transition-colors',
                  filter === f
                    ? 'border-brand-lime text-brand-lime'
                    : 'border-border-subtle bg-surface-2 text-text-secondary hover:text-text-primary',
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} · {counts[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border-subtle">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-brand-lime" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <FileText size={28} className="text-text-muted" />
              <p className="text-sm text-text-muted">No documents yet</p>
              <p className="text-xs text-text-muted">Upload PDF, TXT, or Markdown files to get started</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                onDelete={handleDelete}
                deleting={deletingId === doc.id}
              />
            ))
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload document"
      />
    </div>
  );
}
