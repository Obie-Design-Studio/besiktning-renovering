-- Add content-based duplicate detection to document uploads.
-- SHA-256 hash of the raw file bytes, computed server-side.
-- Nullable so existing rows without a hash are unaffected.
-- Unique partial index ignores nulls (links and legacy rows).

ALTER TABLE document_uploads
  ADD COLUMN content_hash text;

CREATE UNIQUE INDEX document_uploads_content_hash_unique
  ON document_uploads (content_hash)
  WHERE content_hash IS NOT NULL;
