-- Comments for each document section
-- Each row is a message tied to a checklist item slug (or 'ovrig')
-- Self-reported author name — no auth required, site is private-link only

CREATE TABLE comments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_slug text       NOT NULL,
  author_name  text       NOT NULL
                          CHECK (author_name IN ('Besiktningsman', 'Tobias', 'Palmens byggservice')),
  message      text       NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX comments_section_slug_idx ON comments (section_slug);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select" ON comments
  FOR SELECT USING (true);

CREATE POLICY "public_insert" ON comments
  FOR INSERT WITH CHECK (true);

-- AI-readable context for this table
INSERT INTO _ai_context (table_name, description) VALUES
  ('comments', 'Free-text messages left by any of the three parties (inspector, client, contractor) on a specific document section. section_slug matches document_uploads.document_item_slug, or is ''ovrig'' for the extra docs section.');
