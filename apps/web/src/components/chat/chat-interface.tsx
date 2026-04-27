'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { SourcePanel } from './source-panel';
import { sendChatMessage } from '@/lib/api';
import type { ChatSource } from '@/lib/api';

export type ChatMessage =
  | { id: string; role: 'user'; content: string }
  | {
      id: string;
      role: 'assistant';
      content: string;
      sources: ChatSource[];
      latencyMs: number;
      tokens: { input: number; output: number };
      correlationId: string;
    };

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [activeSources, setActiveSources] = useState<ChatSource[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      abortRef.current = false;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await sendChatMessage({
          sessionId,
          message: text,
        });

        if (abortRef.current) return;

        setSessionId(response.sessionId);

        const assistantMessage: ChatMessage = {
          id: response.messageId,
          role: 'assistant',
          content: response.content,
          sources: response.sources,
          latencyMs: response.latencyMs,
          tokens: response.tokens,
          correlationId: response.correlationId,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            err instanceof Error
              ? err.message
              : 'Something went wrong. Please try again.',
          sources: [],
          latencyMs: 0,
          tokens: { input: 0, output: 0 },
          correlationId: '',
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sessionId],
  );

  const handleCitationClick = useCallback(
    (sources: ChatSource[]) => {
      setActiveSources(sources);
      setSourcesOpen(true);
    },
    [],
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Main chat thread */}
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple/10">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-light shadow-glow-purple" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                What can I help you with?
              </h2>
              <p className="max-w-sm text-center text-sm text-text-muted">
                Ask a question about your uploaded documents. I will ground my
                answer in the retrieved context.
              </p>
              <a
                href="/documents"
                className="mt-2 inline-flex items-center gap-2 rounded-md bg-brand-lime px-4 py-2 text-sm font-medium text-bg-canvas transition-colors hover:bg-brand-lime-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
              >
                Upload Documents
              </a>
            </div>
          )}

          <MessageList
            messages={messages}
            onCitationClick={handleCitationClick}
            isLoading={isLoading}
          />
          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>

      {/* Sources panel */}
      <SourcePanel
        open={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        sources={activeSources}
      />
    </div>
  );
}
