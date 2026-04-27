'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  type DocumentItem,
} from '@/lib/api';
import {
  UploadCloud,
  FileText,
  Trash2,
  AlertCircle,
  X,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
];

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
    pending: { icon: <Clock size={12} />, className: 'bg-status-warning/15 text-status-warning', label: 'Pending' },
    parsing: { icon: <Loader2 size={12} className="animate-spin" />, className: 'bg-brand-purple/15 text-brand-purple-light', label: 'Parsing' },
    chunking: { icon: <Loader2 size={12} className="animate-spin" />, className: 'bg-brand-purple/15 text-brand-purple-light', label: 'Chunking' },
    embedding: { icon: <Loader2 size={12} className="animate-spin" />, className: 'bg-brand-purple/15 text-brand-purple-light', label: 'Embedding' },
    completed: { icon: <CheckCircle2 size={12} />, className: 'bg-status-success/15 text-status-success', label: 'Ready' },
    failed: { icon: <AlertCircle size={12} />, className: 'bg-status-danger/15 text-status-danger', label: 'Failed' },
  };

  const c = config[status] ?? config.pending;

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', c.className)}>
      {c.icon}
      {c.label}
    </span>
  );
}

function UploadDropzone({
  onUpload,
  uploading,
}: {
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PDF, TXT, and Markdown files are supported';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File exceeds ${MAX_SIZE_MB}MB limit`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }
      onUpload(file);
    },
    [onUpload, validate],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile],
  );

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors',
          dragOver
            ? 'border-brand-purple bg-brand-purple/5'
            : 'border-border-subtle bg-surface-1 hover:border-border-default hover:bg-surface-2',
          uploading && 'pointer-events-none opacity-60',
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
          {uploading ? (
            <Loader2 size={22} className="animate-spin text-brand-lime" />
          ) : (
            <UploadCloud size={22} className="text-text-muted" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">
            {uploading ? 'Uploading…' : 'Drop a file here, or click to browse'}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            PDF, TXT, Markdown · up to {MAX_SIZE_MB}MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleChange}
          className="hidden"
          aria-label="Upload document"
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-status-danger/10 px-3 py-2 text-xs text-status-danger">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
}

function DocumentCard({
  doc,
  onDelete,
  deleting,
}: {
  doc: DocumentItem;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 transition-colors hover:border-border-default">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-2">
        <FileText size={18} className="text-text-muted" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {doc.originalName}
        </p>
        <div className="mt-1 flex items-center gap-3">
          <StatusBadge status={doc.status} />
          <span className="font-mono text-xs text-text-muted">
            {formatBytes(doc.sizeBytes)}
          </span>
          <span className="text-xs text-text-muted">
            {formatDate(doc.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {confirm ? (
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
              onClick={() => setConfirm(false)}
              className="inline-flex items-center rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-status-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
            aria-label={`Delete ${doc.originalName}`}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
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

  // Poll for status updates every 3 seconds
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Documents</h1>
          <p className="text-sm text-text-muted">
            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
      </div>

      <UploadDropzone onUpload={handleUpload} uploading={uploading} />

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-brand-lime" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-subtle py-12">
            <FileText size={28} className="text-text-muted" />
            <p className="text-sm text-text-muted">No documents yet</p>
            <p className="text-xs text-text-muted">
              Upload PDF, TXT, or Markdown files to get started
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={handleDelete}
              deleting={deletingId === doc.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
