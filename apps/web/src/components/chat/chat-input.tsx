'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

type RouteInfo = {
  route: string;
  topK: number;
  mmr: boolean;
  correlationId: string;
};

type ChatInputProps = {
  onSend: (text: string) => void;
  isLoading: boolean;
  routeInfo?: RouteInfo;
};

export function ChatInput({ onSend, isLoading, routeInfo }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setText('');
    textareaRef.current?.focus();
  }, [text, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="border-t border-border-subtle bg-bg-canvas px-4 py-4 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <div className="flex items-end gap-2 rounded-2xl bg-surface-1 px-3 py-2.5">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
            aria-label="Attach file"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask your agent anything about your knowledge..."
            className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            disabled={isLoading}
            aria-label="Message input"
          />

          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
            aria-label="Voice input"
            title="Voice input"
          >
            <Mic size={18} />
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2',
              text.trim() && !isLoading
                ? 'bg-brand-lime text-bg-canvas hover:bg-brand-lime-hover'
                : 'bg-surface-3 text-text-muted',
            )}
            aria-label="Send message"
            title="Send message"
          >
            <Send size={18} />
          </button>
        </div>

        {routeInfo && (
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-text-muted">
              Route: {routeInfo.route} · top_k={routeInfo.topK} · MMR {routeInfo.mmr ? 'on' : 'off'}
            </span>
            {routeInfo.correlationId && (
              <span className="text-[10px] text-text-muted">
                corr-id {routeInfo.correlationId.slice(0, 8)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
