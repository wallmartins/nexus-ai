-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable documents
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable chunks
CREATE TABLE "chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chunks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable embeddings
CREATE TABLE "embeddings" (
    "id" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "vector" vector(768) NOT NULL,
    "modelName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "embeddings_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "embeddings_chunkId_unique" UNIQUE ("chunkId")
);

-- CreateTable sessions
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable messages
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "latencyMs" INTEGER,
    "tokens" JSONB NOT NULL DEFAULT '{}',
    "correlationId" TEXT NOT NULL,
    "modelProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable evaluation_runs
CREATE TABLE "evaluation_runs" (
    "id" TEXT NOT NULL,
    "datasetVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "models" JSONB NOT NULL DEFAULT '[]',
    "aggregatedMetrics" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "evaluation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable evaluation_results
CREATE TABLE "evaluation_results" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "expectedAnswer" TEXT,
    "generatedAnswer" TEXT NOT NULL,
    "retrievedChunkIds" JSONB NOT NULL DEFAULT '[]',
    "relevanceScore" DOUBLE PRECISION,
    "consistencyScore" DOUBLE PRECISION,
    "groundingScore" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "tokens" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_results_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "evaluation_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "evaluation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable log_entries
CREATE TABLE "log_entries" (
    "id" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable job_records
CREATE TABLE "job_records" (
    "id" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "bullJobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "failedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex documents
CREATE INDEX "documents_status_idx" ON "documents"("status");
CREATE INDEX "documents_createdAt_idx" ON "documents"("createdAt");

-- CreateIndex chunks
CREATE INDEX "chunks_documentId_idx" ON "chunks"("documentId");
CREATE INDEX "chunks_index_idx" ON "chunks"("index");

-- CreateIndex embeddings
CREATE INDEX "embeddings_chunkId_idx" ON "embeddings"("chunkId");

-- CreateIndex messages
CREATE INDEX "messages_sessionId_idx" ON "messages"("sessionId");
CREATE INDEX "messages_correlationId_idx" ON "messages"("correlationId");
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex evaluation_runs
CREATE INDEX "evaluation_runs_status_idx" ON "evaluation_runs"("status");
CREATE INDEX "evaluation_runs_startedAt_idx" ON "evaluation_runs"("startedAt");

-- CreateIndex evaluation_results
CREATE INDEX "evaluation_results_runId_idx" ON "evaluation_results"("runId");
CREATE INDEX "evaluation_results_createdAt_idx" ON "evaluation_results"("createdAt");

-- CreateIndex log_entries
CREATE INDEX "log_entries_correlationId_idx" ON "log_entries"("correlationId");
CREATE INDEX "log_entries_timestamp_idx" ON "log_entries"("timestamp");
CREATE INDEX "log_entries_level_idx" ON "log_entries"("level");
CREATE INDEX "log_entries_eventType_idx" ON "log_entries"("eventType");

-- CreateIndex job_records
CREATE INDEX "job_records_queueName_idx" ON "job_records"("queueName");
CREATE INDEX "job_records_status_idx" ON "job_records"("status");
CREATE INDEX "job_records_bullJobId_idx" ON "job_records"("bullJobId");
