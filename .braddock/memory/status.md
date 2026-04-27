# Status

## Current state

TASK-032 (Ingestion and embedding workers) in review. PR #25 opened.

## Last update

- Vision document read and validated.
- PRD written to `.braddock/memory/prd.md`.
- Architecture written to `.braddock/memory/architecture.md`.
- Specification refined in `.braddock/memory/spec.md` with design system tokens, components, canonical screen patterns, voice/copywriting, mobile patterns, and 10 non-negotiable frontend rules.
- Decisions recorded in `.braddock/memory/decisions.md` (32 decisions including 6 design ADRs from DESIGN-SYSTEM.md).
- Tasks broken down into `.braddock/memory/tasks.json` (40 tasks, 9 epics, 16 stories).
- Kanban board initialized in `.braddock/board/kanban.json`.
- **TASK-001 completed**: Monorepo scaffolded with pnpm workspaces, shared types package compiles, CI placeholder added, README updated.
- **TASK-002 completed**: NestJS app bootstrapped with Zod-based env validation, global exception filter, CORS, and Settings API. PR #2 merged.
- **TASK-003 completed**: Next.js 14+ App Router frontend bootstrap with Tailwind CSS, app shell, sidebar navigation, global error boundary, loading states, and responsive layout. PR #3 merged.
- **TASK-004 completed**: PostgreSQL + pgvector + Prisma setup with DatabaseModule, connection pooling, raw SQL support, and initial migration with pgvector extension. PR #4 merged.
- **TASK-005 completed**: Redis connection module with ioredis, automatic reconnection with exponential backoff, health ping, and configurable retry settings. PR #5 merged.
- **TASK-006 completed**: Docker Compose for local development with PostgreSQL (pgvector), Redis, and Ollama services. PR #6 merged.
- **TASK-007 completed**: Health check endpoint with database, Redis, and pgvector status monitoring. Returns 200 or 503 based on dependency health. PR #7 merged.
- **TASK-008 completed**: Database schema migrations for all 9 entities with foreign keys, cascading deletes, and indexes. PR #8 merged.
- **TASK-009 completed**: Document upload API with validation. POST /api/v1/documents accepts multipart/form-data with MIME type validation (PDF, TXT, MD) and 10MB max size. PR #10 merged.
- **TASK-010 completed**: Document parser and chunking service. DocumentParserService supports PDF, TXT, MD with noise stripping and whitespace normalization. ChunkingService implements recursive character splitting with configurable size/overlap. 18 unit tests pass. PR #11 merged.
- **TASK-014 completed**: LLMProvider interface and Ollama provider. `ILLMProvider` interface defined with `generate(prompt, options): Promise<LlmResponse>`. `OllamaProvider` implements interface, calls local endpoint, returns parsed content with token usage and latency. Handles connection and timeout errors gracefully. 9 unit tests pass. PR #12 merged.
- **TASK-031 completed**: BullMQ queue setup. Queue module registers `ingestion`, `embedding`, and `evaluation` queues using shared Redis connection. Queue names centralized in config. Typed payloads for all 3 queues. Producers can enqueue jobs. 7 unit tests pass. PR #13 merged.
- **TASK-011 completed**: Embedding generation service. `EmbeddingsService` generates embeddings via `OllamaEmbeddingProvider` and stores vectors in pgvector. Updates document status through `embedding` to `completed`. Supports enqueuing embedding jobs via `QueueService`. 8 unit tests pass. PR #14 merged.
- **TASK-024 completed**: Structured logging and correlation ID middleware. `CorrelationService` uses AsyncLocalStorage to propagate correlation IDs. `CorrelationMiddleware` generates/accepts correlation IDs per HTTP request. `LoggerService` uses Pino for structured JSON logs with correlation ID injection. 16 unit tests pass. PR #15 merged.
- **TASK-022 completed**: Session memory service. `MemoryService` stores last N messages per session in Redis with configurable depth and TTL. Supports adding messages, retrieving context, clearing sessions, and extending TTL. 9 unit tests pass. PR #16 merged.
- **TASK-025 completed**: Request logs persistence. `LogPersistenceService` writes structured log entries to PostgreSQL with correlation ID indexing. `ObservabilityController` exposes log querying by correlation ID and time range. 16 unit tests pass. PR merged.
- **TASK-012 completed**: Vector retrieval service with top-k and MMR. `RetrievalService` executes pgvector similarity search with optional Maximal Marginal Relevance diversification. `EmbeddingsService` extended with `embedQuery()` for query embedding generation. `RagModule` registered in `AppModule`. 93 total tests pass. PR #18 merged.
- **TASK-013 completed**: Document deletion API. `DELETE /api/v1/documents/:id` validates document existence before deletion, returns 204 on success or 404 when not found. Prisma cascade deletes associated chunks and embeddings. Controller and service specs added. 106 total tests pass. PR #19 merged.
- **TASK-015 completed**: OpenAI provider implementation. `OpenAiProvider` implements `ILLMProvider`, calls OpenAI chat completions API with JSON mode support. API key read from `OPENAI_API_KEY` env. Returns parsed response with input/output token counts and latency. 115 total tests pass. PR #20 merged.
- **TASK-016 completed**: Anthropic provider implementation. `AnthropicProvider` implements `ILLMProvider`, calls Anthropic Messages API. API key read from `ANTHROPIC_API_KEY` env. Returns parsed response with input/output token counts and latency. 123 total tests pass. PR #21 merged.
- **TASK-017 completed**: Prompt manager and guardrails service. `PromptManager` loads versioned TypeScript prompt assets from `src/llm/prompts/`. `GuardrailService` validates input (empty/oversized) with HTTP 400 and output against Zod schemas with one retry. `maxInputLength` added to settings. 150 total tests pass. PR #22 merged.
- **TASK-019 completed**: LangGraph setup and decision agent. `@langchain/core` and `@langchain/langgraph` installed. `DecisionAgent` uses a 2-node state graph (classify -> route) to classify queries as DIRECT or RAG. Classification decisions logged with correlation ID. Falls back to RAG on errors. 158 total tests pass. PR #23 merged.
- **TASK-023 completed**: Response cache service. `CacheService` generates deterministic SHA-256 cache keys from query + provider + model + ordered chunk IDs. Stores responses in Redis with configurable TTL (default 1h). Cache hits return `cached: true`. Auto-invalidates corrupted entries. 142 total tests pass. PR #24 merged.
- **TASK-032 completed**: Ingestion and embedding workers. `IngestionWorker` (concurrency=1) parses documents, chunks text, stores chunks in DB, and enqueues embedding jobs. `EmbeddingWorker` (concurrency=2) generates embeddings via `EmbeddingsService` and stores vectors in pgvector. `JobRecordService` mirrors BullMQ job status to `JobRecord` table. 181 total tests pass. PR #25 merged.
- **TASK-020 completed**: Synthesis workflow. `SynthesisWorkflow` orchestrates classify → retrieve → synthesize → validate → format. Supports RAG and DIRECT paths, zero-chunk guard, response caching, session memory injection, and provider/model overrides. 191 total tests pass. PR #26 merged.
- **TASK-035 completed**: Chat API endpoint. `POST /api/v1/chat` accepts message, optional sessionId, and options. `ChatService` orchestrates `SynthesisWorkflow`, persists messages to PostgreSQL, updates Redis session memory, and auto-creates sessions. `GET /api/v1/chat/sessions/:sessionId/messages` returns ordered history. Input guardrails via `GuardrailService`. 204 total tests pass. PR #27 merged.
- **TASK-037 in review**: Chat UI with citations and sources panel. `/chat` page with message input, streaming assistant responses (typewriter effect), inline citation markers `[N]` as clickable buttons, expandable sources panel with chunk previews and similarity scores. Multi-turn conversations retain context. Accessible focus states and keyboard navigation. All components use Tailwind v4 theme tokens. Next.js build passes. PR #28 opened.

## Suggested next step

Review/merge PR #28 for TASK-037, then select the next eligible task from the critical path when instructed.
