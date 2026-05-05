-- AI-suggested re-filing: when a document is mis-categorised, the background
-- AI check writes the better slug here. Tobias sees a one-click "move" prompt.
-- Cleared to NULL when Tobias accepts the suggestion or the document is moved.

ALTER TABLE document_uploads
  ADD COLUMN IF NOT EXISTS suggested_slug TEXT;

COMMENT ON COLUMN document_uploads.suggested_slug IS
  'Slug that AI recommends this document should be moved to, when it differs from
   document_item_slug. NULL means no re-filing suggestion. Written by the
   /api/recheck-section background job, cleared on move or when the document is
   already in the right place. Tobias sees a one-click prompt to confirm the move.';
