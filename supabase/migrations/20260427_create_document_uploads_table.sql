-- ============================================================
-- Besiktning & Renovering — schema v2
-- Replaces the initial inspections table.
-- ============================================================
-- One project, one fixed checklist of required documents.
-- Each checklist item is identified by a slug defined in code
-- (src/data/checklist-items.ts). Uploads are linked to items
-- via that slug — no FK needed since the list is code-managed.
-- ============================================================

-- AI context index
CREATE TABLE IF NOT EXISTS _ai_context (
  id          SERIAL      PRIMARY KEY,
  table_name  TEXT        NOT NULL,
  description TEXT        NOT NULL,
  query_hints TEXT,
  key_columns TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE _ai_context IS
  'AI-readable index of the database schema. Query this table first to understand
   the data model before writing queries against domain tables.';

-- ============================================================
-- document_uploads
-- ============================================================

CREATE TABLE document_uploads (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_item_slug   TEXT        NOT NULL,
  file_url             TEXT        NOT NULL,
  file_name            TEXT        NOT NULL,
  file_source          TEXT        NOT NULL DEFAULT 'upload',
  upload_title         TEXT        NOT NULL,
  upload_description   TEXT        NOT NULL,
  uploader_name        TEXT        NOT NULL,
  uploaded_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE document_uploads IS
  'One row per uploaded document for the Lund 25:16 slutbesiktning.
   Each row belongs to a checklist item identified by document_item_slug.
   The checklist itself is defined in code (src/data/checklist-items.ts).
   Multiple uploads per item are allowed (e.g. VVS may have several protocols).
   No authentication — Tobias and Palmens byggservice upload without login.';

COMMENT ON COLUMN document_uploads.document_item_slug IS
  'Slug identifying which checklist item this upload belongs to.
   Valid values are defined in src/data/checklist-items.ts.
   Examples: vvs-egenkontroll | vatrum-tatskikt | el-egenkontroll | bygg-egenkontroll |
             drift-underhall | relationshandlingar | kontrakt-handlingar | garantier';

COMMENT ON COLUMN document_uploads.file_url IS
  'Public URL to the document.
   For uploads: Supabase Storage public URL (inspection-pdfs bucket).
   For links: external URL pasted by the user.';

COMMENT ON COLUMN document_uploads.file_name IS
  'Original filename for uploaded PDFs, or the last URL path segment for links.';

COMMENT ON COLUMN document_uploads.file_source IS
  'How the document was provided.
   Valid: upload (PDF to Supabase Storage) | link (external URL).';

COMMENT ON COLUMN document_uploads.upload_title IS
  'Short title given by the uploader, e.g. "Provtryckningsprotokoll VVS 2025-04".
   AI: embed for semantic search.';

COMMENT ON COLUMN document_uploads.upload_description IS
  'Free-text description from the uploader explaining what the file contains.
   AI: embed for semantic search.';

COMMENT ON COLUMN document_uploads.uploader_name IS
  'Who submitted this file.
   Valid: Tobias | Palmens byggservice';

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select" ON document_uploads
  FOR SELECT USING (true);

CREATE POLICY "public_insert" ON document_uploads
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- AI context
-- ============================================================

INSERT INTO _ai_context (table_name, description, query_hints, key_columns) VALUES
  ('document_uploads',
   'Uploaded documents for the Lund 25:16 slutbesiktning project.
    Each row is one file or link submitted by Tobias or Palmens byggservice
    for a specific checklist item (e.g. VVS egenkontroll, El protokoll).
    The checklist items themselves are hardcoded in src/data/checklist-items.ts.',
   'SELECT * FROM document_uploads WHERE document_item_slug = ''vvs-egenkontroll'' to see all VVS uploads.
    SELECT document_item_slug, COUNT(*) FROM document_uploads GROUP BY document_item_slug to see coverage.
    SELECT DISTINCT document_item_slug FROM document_uploads to see which items have at least one upload.',
   'id, document_item_slug, upload_title, uploader_name, file_url, uploaded_at');
