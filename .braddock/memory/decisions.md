# Decisions

> Recorded during `/create-spec` by `tech-lead`, `architect-specialist`, and `ui-ux` agents.

---

## Architecture & Technology

### D1 — Modular AI-Native Monolith
**Decision:** Single NestJS backend and single Next.js frontend, with sharp internal module boundaries.
**Rationale:** No independent scaling requirements per module in MVP. Eliminates network overhead, simplifies local dev, and keeps Render/Railway deployment trivial. Modules are bounded so extraction later is plumbing-only.
**Date:** 2026-04-24

### D2 — PostgreSQL + pgvector as Vector Store
**Decision:** Reuse PostgreSQL with pgvector extension instead of a dedicated vector database.
**Rationale:** Zero additional infrastructure. The team already needs PostgreSQL for relational data; adding pgvector avoids a second database to manage, backup, and secure. For MVP scale (< 10k chunks), `ivfflat` indexing is sufficient.
**Trade-off:** pgvector lacks advanced hybrid search and may degrade at > 100k chunks without HNSW tuning. Migration to Pinecone/Qdrant is documented as a post-MVP scaling strategy.
**Date:** 2026-04-24

### D3 — LangGraph for Agents, Thin Adapters for Core AI
**Decision:** LangGraph manages decision and multi-step workflow state machines, while LLM/embedding calls use lightweight native SDK adapters (Ollama, OpenAI) to avoid framework lock-in.
**Rationale:** LangGraph provides explicit state management and visualizable graphs without forcing LangChain abstractions into every layer.
**Trade-off:** LangGraph is newer and has a smaller community than LangChain; debugging state transitions requires learning curve. Mitigated by keeping graphs simple (4 nodes max in MVP).
**Date:** 2026-04-24

### D4 — Hybrid LLM Strategy via `LLMProvider` Abstraction
**Decision:** Ollama is the default for zero-cost local development; OpenAI/Anthropic are selectable via configuration for validation and polished demos.
**Rationale:** Development cost must be $0. Local models enable rapid iteration without API keys or quota anxiety. A clean `LLMProvider` interface makes cloud switching a runtime config change.
**Trade-off:** Local models are slower and less capable than cloud APIs. The hybrid strategy mitigates this: validate locally, polish demos with cloud.
**Date:** 2026-04-24

### D5 — Redis as Unified Infrastructure
**Decision:** One Redis instance serves three roles: session memory, response cache, and BullMQ message broker for async queues.
**Rationale:** Redis is already required for sessions and caching. BullMQ provides robust job semantics without introducing a second infrastructure component.
**Trade-off:** Redis becomes a single point of failure for both caching and background jobs. Mitigated by using Redis persistence (AOF) and keeping queue jobs idempotent.
**Date:** 2026-04-24

### D6 — NestJS over Express / Fastify Raw
**Decision:** Use NestJS for the backend.
**Rationale:** Strong module boundaries, dependency injection, and built-in support for middleware, interceptors, and pipes enforce consistency across a multi-developer team.
**Trade-off:** NestJS has a steeper learning curve for developers unfamiliar with decorators and DI containers. Mitigated by clear module conventions documented in the project.
**Date:** 2026-04-24

### D7 — Prisma over TypeORM (Recommended)
**Decision:** Prisma is the recommended ORM for schema management and type-safe queries.
**Rationale:** Prisma offers superior type safety, migration tooling, and query performance for PostgreSQL.
**Trade-off:** Prisma has known issues with very complex raw queries (e.g., pgvector `<=>` operators). Mitigated by using Prisma for relational CRUD and raw SQL for vector search.
**Date:** 2026-04-24

---

## Design & UX

### D20 — Dark-First Design System (No Light Mode)
**Decision:** The UI is exclusively dark-mode with `bg.canvas` = `#000000`. No light mode toggle.
**Rationale:** The product positions itself as a serious technical tool. Dark-first conveys focus and technical credibility. All tokens are optimized for pure-black canvas; adding a light mode would require duplicating the entire token system and visual QA.
**Date:** 2026-04-24

### D21 — Geist as the Sole Typeface
**Decision:** Use Geist (sans + mono) as the only font family. Weights limited to Regular (400), Medium (500), Semibold (600).
**Rationale:** Matches the reference design (Learning Sync) exactly. Geist is a Vercel-native font with excellent rendering at all sizes. Limiting weights enforces typographic discipline and reduces bundle size.
**Date:** 2026-04-24

### D22 — Lime + Purple Dual Chromatic Purpose
**Decision:** `brand.lime.400` (#C5F547) signals action/progress/positive state. `brand.purple.500` (#8B5CF6) signals intelligence/AI/insight.
**Rationale:** Every accent color carries semantic meaning. This dual-coding makes the interface scannable and reinforces product positioning: lime = user action / grounded results, purple = AI presence / computation.
**Date:** 2026-04-24

### D23 — Token-Driven UI via Tailwind v4 @theme
**Decision:** All visual properties exposed as CSS custom properties through Tailwind v4 `@theme`. No arbitrary values in component code.
**Rationale:** Ensures consistency, enables rapid global theme adjustments, and makes the design system auditable. Three-tier token architecture (primitives → semantic → component) supports future scaling without rewrites.
**Date:** 2026-04-24

### D24 — lucide-react with Mandatory Circular Containers
**Decision:** All icons from `lucide-react` must live inside circular containers (32px or 40px) with contrasting backgrounds.
**Rationale:** Raw line icons on pure-black canvas lack visibility. Circular containers provide necessary contrast and create a consistent visual rhythm across the interface.
**Date:** 2026-04-24

### D25 — Recharts for Standard Charts, Visx for Custom
**Decision:** Use Recharts for standard chart types (donut, bar, line). Visx reserved for custom visualizations (star particles, animated orbs) if needed.
**Rationale:** Recharts integrates cleanly with React and Tailwind. Chart.js is too DOM-heavy and less flexible for the required dark aesthetic. Visx offers the granularity needed for signature AI visual effects.
**Date:** 2026-04-24

### D26 — Signature Components as Identity Anchors
**Decision:** Three components are mandatory on primary screens: Orb AI (chat hero), Featured AI Card (observability panel), and at least one Featured Metric Card (lime bg).
**Rationale:** These components differentiate the product from generic dark dashboards. Their presence is a contractual deliverable per the visual checklist.
**Date:** 2026-04-24

### D27 — Dark-First, No Light Mode (ADR-001)
**Decision:** The UI is exclusively dark-mode. No light mode toggle.
**Rationale:** Nexus is used in monitoring contexts (observability, evals). Light mode would double maintenance surface without validated ROI. Revisit if >30% of users request it.
**Date:** 2026-04-24

### D28 — Single Primary Color (Lime) Instead of Expanded Palette (ADR-002)
**Decision:** Lime is the sole primary brand color. Purple is reserved for the "AI" category.
**Rationale:** Isolated lime creates strong visual anchoring: "lime = action or active". Expanding to multiple brand tones dilutes semantics. Purple is reserved for AI-specific elements (orbs, insight gradients).
**Date:** 2026-04-24

### D29 — Monospace Only for Technical Data (ADR-003)
**Decision:** JetBrains Mono is used exclusively for IDs, timestamps, numeric metrics, paths, code. Inter is used for all UI text.
**Rationale:** Monospace visually signals "this is ID/number/code". Keeping this dogma ensures consistent scannability. If it isn't technical, it isn't mono.
**Date:** 2026-04-24

### D30 — No Shadow on Cards (ADR-004)
**Decision:** Cards do not use box-shadow. Elevation is communicated via surface level + border.
**Rationale:** Shadows on dark UI turn into gray blur. Separation comes from `surface-1` + `border-subtle`. Exception: modal overlays use `0 20px 80px rgba(0,0,0,0.4)`.
**Date:** 2026-04-24

### D31 — Citations Always Numbered and Inline (ADR-005)
**Decision:** Every factual agent claim has a clickable `[N]` citation that opens the source chunk.
**Rationale:** Grounding is the core product value. Inline numbered citations reinforce this visually and make every answer auditable.
**Date:** 2026-04-24

### D32 — Artboards Do Not Scroll Internally (ADR-006)
**Decision:** Each screen is a complete document with variable height. No internal scroll containers ("scroll pits").
**Rationale:** Internal scrolling creates invisible content pits. If a screen grows, increase the artboard height and let the viewport scroll externally.
**Date:** 2026-04-24

---

## AI / RAG

### D8 — Prompts as Versioned TypeScript Assets
**Decision:** All prompt templates live in code (TypeScript), versioned by Git, and loaded at runtime by a `PromptManager`. No prompt drift in production.
**Rationale:** Every prompt change requires a PR review. Prevents silent prompt drift and makes rollbacks trivial.
**Date:** 2026-04-24

### D9 — Embedding Dimension Flexibility
**Decision:** The `Embedding.vector` field dimension (768 or 1536) is determined by the active embedding model; the application will validate dimension alignment at runtime.
**Rationale:** Supports both local models (e.g., `nomic-embed-text`, 768d) and cloud models (e.g., `text-embedding-3-small`, 1536d) without schema migrations.
**Date:** 2026-04-24

### D33 — Embedding Model Provider Resolution by Prefix
**Decision:** `EmbeddingsService.resolveProvider` uses a simple prefix heuristic (`modelName.startsWith('text-embedding')` → 'openai', else → 'ollama') to route models to providers. No fixed model registry.
**Rationale:** Avoids maintaining a hardcoded list of model names. Callers pass any `modelName`; resolution is deterministic and extensible. When new providers are added, the prefix rule is expanded (e.g., `startsWith('cohere')` → 'cohere').
**Trade-off:** Assumes model naming conventions from providers are stable. If a provider breaks convention, the rule is adjusted in one place.
**Date:** 2026-04-24

### D34 — Document Upload Pipeline Gap
**Decision:** `DocumentsService.create()` currently creates the document record but does NOT enqueue an embedding job. The ingestion worker (TASK-032) is responsible for parsing, chunking, and triggering embedding.
**Rationale:** Upload API should remain lightweight and return quickly. Heavy processing (parsing, chunking, embedding) is async via BullMQ worker.
**Gap:** The ingestion worker does not exist yet. Until TASK-032 is implemented, uploaded documents remain in `pending` status indefinitely.
**Date:** 2026-04-24

### D10 — Cache Key Fingerprinting
**Decision:** Response cache keys include a hash of query text + provider + model + ordered list of top-k chunk IDs to ensure cache invalidation when underlying documents change.
**Rationale:** Prevents stale cached responses after document updates or ingestion.
**Date:** 2026-04-24

---

## Security & Auth

### D11 — No Authentication in MVP
**Decision:** The system is single-tenant/single-user; session IDs are generated per browser session without login. Authentication is deferred post-MVP.
**Rationale:** MVP focus is on core AI functionality. Auth adds complexity (user management, passwords, sessions) that is out of scope for initial demonstration.
**Date:** 2026-04-24

### D12 — File Size and Storage Limits
**Decision:** 10MB per file, 100MB total deployment storage cap for MVP.
**Rationale:** Prevents abuse and keeps local storage / free-tier cloud databases manageable. Enforced at API gateway and UI.
**Date:** 2026-04-24

---

## UX / UI

### D13 — Comparison Mode Layout
**Decision:** Comparison mode uses a split-pane layout on desktop (50/50) and stacked tabs on viewports below `1024px`. Each pane is color-coded with a subtle left border (A = slate, B = indigo).
**Rationale:** Prevents user confusion when running two models side-by-side. Responsive fallback ensures usability across devices.
**Date:** 2026-04-24

### D14 — Trace Timeline Visualization
**Decision:** The trace timeline is rendered as a horizontal Gantt-style bar inside the drawer. Each stage is color-coded and proportional to duration.
**Rationale:** Enables instant visual diagnosis of latency bottlenecks (retrieval vs. LLM vs. errors).
**Date:** 2026-04-24

### D15 — Real-Time Status via SSE with Polling Fallback
**Decision:** Server-Sent Events (SSE) for ingestion jobs and evaluation runs. Fallback to short polling (`3s` interval) if SSE fails.
**Rationale:** SSE is simpler than WebSockets for unidirectional server-to-client updates. Polling fallback ensures reliability.
**Date:** 2026-04-24

---

## Queues & Processing

### D16 — Queue Concurrency Defaults
**Decision:** Ingestion queue max concurrency = 1 (CPU-bound parsing), Embedding queue = 2 (GPU/CPU-bound), Evaluation queue = 1 (to control LLM rate limits and cost).
**Rationale:** Prevents resource exhaustion on local machines and controls cloud API costs during evaluation.
**Date:** 2026-04-24

### D17 — Redis Session and Cache TTL
**Decision:** 24 hours default for session memory; 1 hour default for response cache. Both are configurable via settings.
**Rationale:** Balances continuity (users can return the next day) with memory hygiene. Cache TTL prevents stale responses without being overly aggressive.
**Date:** 2026-04-24

---

## Evaluation

### D18 — Heuristic + Lightweight LLM Judge Scoring
**Decision:** Evaluation scoring combines automated heuristics (token overlap, embedding similarity) with an optional lightweight LLM judge. A fixed human review sample (10 questions per run) is used for validation.
**Rationale:** Fully automated scoring may not reflect true answer quality. Human review keeps the dataset small and interpretable.
**Date:** 2026-04-24

### D19 — Evaluation Runs Isolated from Production
**Decision:** Evaluation runs use a distinct correlation_id prefix (`eval-{runId}`) and do not affect production caches or logs.
**Rationale:** Prevents evaluation traffic from polluting production observability metrics and caches.
**Date:** 2026-04-24

---

*Document version: 1.0*
*Last updated: 2026-04-24*
