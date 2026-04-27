'use client';

import { useState, useEffect, useCallback } from 'react';
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
      className="mx-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-brand-purple/15 px-1 text-xs font-medium text-brand-purple-light transition-colors hover:bg-brand-purple/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
      aria-label={`View source ${index}`}
    >
      {index}
    </button>
  );
}

function TypewriterText({
  text,
  speed = 8,
}: {
  text: string;
  speed?: number;
}) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayed}</span>;
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

  const handleCitationClick = useCallback(
    (index: number) => {
      if (message.role !== 'assistant') return;
      // Find the source at the given 1-based index
      const source = message.sources[index - 1];
      if (source) {
        onCitationClick([source]);
      }
    },
    [message, onCitationClick],
  );

  const handleShowAllSources = useCallback(() => {
    if (message.role === 'assistant' && message.sources.length > 0) {
      onCitationClick(message.sources);
    }
  }, [message, onCitationClick]);

  return (
    <div
      className={cn(
        'flex w-full gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar */}
      <div className="flex shrink-0 flex-col items-center">
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-lime text-xs font-semibold text-bg-canvas">
            U
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-purple/10">
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-light" />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={cn('flex max-w-[85%] flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'rounded-[20px] rounded-tr-sm bg-brand-lime text-bg-canvas'
              : 'rounded-[20px] rounded-tl-sm bg-surface-1 text-text-primary',
          )}
        >
          {isUser ? (
            message.content
          ) : (
            <div className="whitespace-pre-wrap">
              {parseContentWithCitations(message.content, handleCitationClick)}
            </div>
          )}
        </div>

        {/* Metrics */}
        {!isUser && message.role === 'assistant' && (
          <div className="flex items-center gap-2 px-1">
            {message.sources.length > 0 && (
              <button
                type="button"
                onClick={handleShowAllSources}
                className="text-xs text-text-muted transition-colors hover:text-brand-purple-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
              >
                {message.sources.length} source
                {message.sources.length > 1 ? 's' : ''}
              </button>
            )}
            {message.latencyMs > 0 && (
              <span className="text-xs text-text-muted">
                {message.latencyMs}ms
              </span>
            )}
            {message.tokens.input > 0 && (
              <span className="text-xs text-text-muted">
                {message.tokens.input + message.tokens.output} tokens
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
