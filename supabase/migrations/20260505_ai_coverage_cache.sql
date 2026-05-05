-- Persists AI mandatory-coverage decisions so the result survives page loads
-- and does not re-call Gemini on every SSR (avoids Vercel serverless timeout).
--
-- A row means: "AI judged this required slug as covered by another document in
-- the same category, even though no file is filed directly under that slug."
-- Rows are written by the /api/recheck-section endpoint (Tobias-only).

CREATE TABLE IF NOT EXISTS ai_coverage_cache (
  slug        TEXT        PRIMARY KEY,
  covered     BOOLEAN     NOT NULL,
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rationale   TEXT
);

COMMENT ON TABLE ai_coverage_cache IS
  'Cached AI coverage judgments for required checklist slugs (see mandatory-coverage-ai.ts). '
  'Written only via /api/recheck-section when Tobias triggers a re-check. '
  'A row with covered=true means AI confirmed the requirement is satisfied by an existing document.';

ALTER TABLE ai_coverage_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read" ON ai_coverage_cache
  FOR SELECT USING (true);
