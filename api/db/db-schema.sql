CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS products (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name VARCHAR(255),
	description TEXT,
	attributes JSONB,
	solutions JSONB,
	category VARCHAR(100),
	image_url VARCHAR(500),
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_embeddings (
	product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
	content TEXT NOT NULL,
	embedding VECTOR(1536) NOT NULL,
 	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS product_embeddings_embedding_idx
	ON product_embeddings USING ivfflat (embedding vector_cosine_ops)
	WITH (lists = 100);
