-- Tobias-only manual “section complete” flags (authorization enforced in server actions).

CREATE TABLE IF NOT EXISTS checklist_section_completion (
  nav_id TEXT PRIMARY KEY,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE checklist_section_completion IS
  'Manual completion markers per sticky-nav section (nav-vvs, nav-el, …). Writes only via server actions when cookie identity is Tobias.';

ALTER TABLE checklist_section_completion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read" ON checklist_section_completion
  FOR SELECT USING (true);
