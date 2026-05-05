'use server'

import { createSupabaseServer } from '@/lib/supabase'
import { isTobiasSession } from '@/lib/server-identity'
import { CHECKLIST_ITEMS } from '@/data/checklist-items'

const VALID_SLUGS = new Set(['ovrig', ...CHECKLIST_ITEMS.map((i) => i.slug)])

/**
 * Tobias-only: move a document to the AI-suggested slug and clear the suggestion.
 * Used by the one-click "Move to [section]" prompt shown next to mis-filed documents.
 */
export async function moveDocumentToSlug(
  documentId: string,
  targetSlug: string,
): Promise<{ success: boolean; error?: string }> {
  if (!(await isTobiasSession())) {
    return { success: false, error: 'Endast Tobias kan flytta dokument.' }
  }
  if (!documentId) return { success: false, error: 'Inget dokument-ID.' }
  if (!VALID_SLUGS.has(targetSlug)) return { success: false, error: 'Ogiltigt målalternativ.' }

  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('document_uploads')
    .update({ document_item_slug: targetSlug, suggested_slug: null })
    .eq('id', documentId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
