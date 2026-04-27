'use client';

import { MessageBubble } from './message-bubble';
import type { ChatMessage } from './chat-interface';
import type { ChatSource } from '@/lib/api';

type MessageListProps = {
  messages: ChatMessage[];
  onCitationClick: (sources: ChatSource[]) => void;
  isLoading: boolean;
};

export function MessageList({
  messages,
  onCitationClick,
  isLoading,
}: MessageListProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onCitationClick={onCitationClick}
        />
      ))}

      {isLoading && (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 shadow-glow-purple">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-light" />
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-surface-1 px-4 py-3">
            <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted" />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-text-muted"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-text-muted"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
