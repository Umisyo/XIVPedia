-- pg_trgm 拡張の有効化（Supabase では既に利用可能）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 記事タイトルの trigram GIN インデックス
CREATE INDEX IF NOT EXISTS articles_title_trgm_idx ON articles USING gin (title gin_trgm_ops);

-- 記事本文の trigram GIN インデックス
CREATE INDEX IF NOT EXISTS articles_body_trgm_idx ON articles USING gin (body gin_trgm_ops);
