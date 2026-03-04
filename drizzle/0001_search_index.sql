-- pg_trgm 拡張の有効化
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 検索用 GIN インデックス
CREATE INDEX idx_articles_title_trgm ON articles USING gin (title gin_trgm_ops);
CREATE INDEX idx_articles_body_trgm ON articles USING gin (body gin_trgm_ops);
