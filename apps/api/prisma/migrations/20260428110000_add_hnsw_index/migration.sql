-- Conditionally create HNSW index on embeddings.vector for cosine similarity
-- HNSW access method is available in pgvector >= 0.5.0
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_am WHERE amname = 'hnsw') THEN
    CREATE INDEX IF NOT EXISTS "embeddings_vector_hnsw_idx"
    ON "embeddings" USING hnsw ("vector" vector_cosine_ops);
  END IF;
END $$;
