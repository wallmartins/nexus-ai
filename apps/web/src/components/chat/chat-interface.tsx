'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Search, Quote, Eye, Zap, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
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

type Conversation = {
  id: string;
  title: string;
  turnCount: number;
  provider: string;
  dateGroup: 'TODAY' | 'YESTERDAY';
};

const mockConversations: Conversation[] = [
  { id: '1', title: 'Pricing model for enterprise tier', turnCount: 8, provider: 'Ollama', dateGroup: 'TODAY' },
  { id: '2', title: 'Ingestion limits in MVP', turnCount: 3, provider: 'GPT-4o', dateGroup: 'TODAY' },
  { id: '3', title: 'Guardrails policy review', turnCount: 12, provider: 'Claude 3.5', dateGroup: 'YESTERDAY' },
  { id: '4', title: 'What does chunking size do?', turnCount: 5, provider: 'Ollama', dateGroup: 'YESTERDAY' },
  { id: '5', title: 'Eval metrics explained', turnCount: 2, provider: 'Ollama', dateGroup: 'YESTERDAY' },
];

const quickActions = [
  { label: 'Cite every answer', Icon: Quote, color: 'text-brand-purple-light', bg: 'bg-brand-purple/15' },
  { label: 'Show retrieval sources', Icon: Eye, color: 'text-blue-400', bg: 'bg-blue-400/15' },
  { label: 'Explain last failure', Icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/15' },
  { label: 'Generate eval cases', Icon: CheckSquare, color: 'text-orange-400', bg: 'bg-orange-400/15' },
];

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSources, setActiveSources] = useState<ChatSource[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('1');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-show sources from latest assistant message
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistant && lastAssistant.sources.length > 0) {
      setActiveSources(lastAssistant.sources);
    }
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
    },
    [],
  );

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const routeInfo = {
    route: 'RAG',
    topK: 5,
    mmr: true,
    correlationId: lastAssistant?.correlationId ?? '',
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left sidebar */}
      <div className="hidden w-[240px] shrink-0 flex-col border-r border-border-subtle bg-bg-canvas lg:flex">
        <div className="p-4">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-brand-lime px-4 py-2.5 text-sm font-medium text-bg-canvas transition-colors hover:bg-brand-lime-hover"
          >
            <Plus size={16} />
            New conversation
          </button>
        </div>
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 rounded-lg bg-surface-1 px-3 py-2 text-sm text-text-muted">
            <Search size={14} />
            <span>Search sessions...</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {(['TODAY', 'YESTERDAY'] as const).map((group) => (
            <div key={group} className="py-2">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {group}
              </div>
              {mockConversations
                .filter((c) => c.dateGroup === group)
                .map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveConversationId(conv.id)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left transition-colors',
                      activeConversationId === conv.id
                        ? 'bg-surface-1'
                        : 'hover:bg-surface-1/50'
                    )}
                  >
                    <div className="text-sm font-medium text-text-primary">
                      {conv.title}
                    </div>
                    <div className="text-xs text-text-muted">
                      {conv.turnCount} turns · {conv.provider}
                    </div>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex flex-1 flex-col min-w-0">
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

        {/* Quick actions */}
        {messages.length > 0 && (
          <div className="px-4 pb-3 lg:px-8">
            <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="flex items-center gap-2.5 rounded-xl bg-surface-1 px-3.5 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-2"
                >
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', action.bg)}>
                    <action.Icon size={14} className={action.color} />
                  </span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <ChatInput onSend={handleSend} isLoading={isLoading} routeInfo={routeInfo} />
      </div>

      {/* Right sidebar */}
      {activeSources.length > 0 && (
        <SourcePanel sources={activeSources} />
      )}
    </div>
  );
}
