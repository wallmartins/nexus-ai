'use client';

import { useState, useCallback } from 'react';
import { Copy, RefreshCw, MoreHorizontal, Shield, Clock, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from './chat-interface';
import type { ChatSource } from '@/lib/api';

type MessageBubbleProps = {
  message: ChatMessage;
  onCitationClick: (sources: ChatSource[]) => void;
};

function CitationButton({
  index,
  onClick,
}: {
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded text-[10px] font-medium text-brand-lime transition-colors hover:text-brand-lime-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
      aria-label={`View source ${index}`}
    >
      [{index}]
    </button>
  );
}

function parseContentWithCitations(
  content: string,
  onCitationClick: (index: number) => void,
) {
  const parts: React.ReactNode[] = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index);
    if (before) parts.push(before);

    const index = parseInt(match[1], 10);
    parts.push(
      <CitationButton
        key={`cite-${match.index}`}
        index={index}
        onClick={() => onCitationClick(index)}
      />,
    );

    lastIndex = regex.lastIndex;
  }

  const after = content.slice(lastIndex);
  if (after) parts.push(after);

  return parts;
}

export function MessageBubble({ message, onCitationClick }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCitationClick = useCallback(
    (index: number) => {
      if (message.role !== 'assistant') return;
      const source = message.sources[index - 1];
      if (source) {
        onCitationClick([source]);
      }
    },
    [message, onCitationClick],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [message.content]);

  const groundedScore =
    message.role === 'assistant' && message.sources.length > 0
      ? Math.max(...message.sources.map((s) => s.score)).toFixed(2)
      : null;

  const latencyText =
    message.role === 'assistant' && message.latencyMs > 0
      ? message.latencyMs >= 1000
        ? `${(message.latencyMs / 1000).toFixed(1)}s`
        : `${message.latencyMs}ms`
      : null;

  const totalTokens =
    message.role === 'assistant'
      ? message.tokens.input + message.tokens.output
      : 0;

  return (
    <div
      className={cn(
        'flex w-full gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar - only for assistant */}
      {!isUser && (
        <div className="flex shrink-0 flex-col items-center pt-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-purple/10 shadow-glow-purple">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-light" />
          </div>
        </div>
      )}

      {/* Bubble */}
      <div className={cn('flex max-w-[85%] flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        {/* Agent label */}
        {!isUser && (
          <div className="mb-1 text-xs font-medium text-text-muted">
            Nexus Agent · RAG route
          </div>
        )}

        {isUser ? (
          <div className="rounded-[20px] rounded-tr-sm bg-brand-lime px-5 py-3 text-sm font-medium text-bg-canvas">
            {message.content}
          </div>
        ) : (
          <>
            <div className="rounded-2xl rounded-tl-sm bg-surface-1 px-5 py-4 text-sm leading-relaxed text-text-primary">
              <div className="whitespace-pre-wrap">
                {parseContentWithCitations(message.content, handleCitationClick)}
              </div>
            </div>

            {/* Metrics bar */}
            <div className="mt-1 flex w-full items-center justify-between px-1">
              <div className="flex items-center gap-4">
                {groundedScore && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-lime">
                    <Shield size={12} />
                    Grounded · {groundedScore}
                  </span>
                )}
                {latencyText && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                    <Clock size={12} />
                    {latencyText}
                  </span>
                )}
                {totalTokens > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                    <Cpu size={12} />
                    {totalTokens} tok
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
                  aria-label={copied ? 'Copied' : 'Copy message'}
                  title={copied ? 'Copied' : 'Copy message'}
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
                  aria-label="Regenerate response"
                  title="Regenerate response"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
                  aria-label="More options"
                  title="More options"
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
