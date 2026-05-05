/**
 * Standalone helper: fetches all uploads from Supabase, runs the AI mandatory-
 * coverage check, and writes results to `ai_coverage_cache`.
 *
 * Designed to be called from `after()` in server actions so it runs in the
 * background after the response has already been sent to the user.
 */

import { createSupabaseServer } from '@/lib/supabase'
import { resolveAiMandatoryCoverage } from '@/lib/mandatory-coverage-ai'
import { CHECKLIST_ITEMS } from '@/data/checklist-items'
import type { DocumentUpload } from '@/types/document'

export async function refreshAiCoverageInBackground(): Promise<void> {
  try {
    const supabase = createSupabaseServer()

    const { data: uploads, error } = await supabase
      .from('document_uploads')
      .select('*')
      .order('uploaded_at', { ascending: true })

    if (error || !uploads) return

    const uploadsBySlug: Record<string, DocumentUpload[]> = {}
    const extraUploads: DocumentUpload[] = []
    for (const u of uploads as DocumentUpload[]) {
      if (u.document_item_slug === 'ovrig') {
        extraUploads.push(u)
      } else {
        uploadsBySlug[u.document_item_slug] = [
          ...(uploadsBySlug[u.document_item_slug] ?? []),
          u,
        ]
      }
    }

    const { satisfiedSlugs, misfiledSuggestions } = await resolveAiMandatoryCoverage(uploadsBySlug, extraUploads)
    const requiredSlugs = CHECKLIST_ITEMS.filter((i) => i.required).map((i) => i.slug)
    const satisfiedSet = new Set(satisfiedSlugs)

    const cacheRows = requiredSlugs.map((slug) => ({
      slug,
      covered: satisfiedSet.has(slug),
      checked_at: new Date().toISOString(),
    }))

    await supabase.from('ai_coverage_cache').upsert(cacheRows, { onConflict: 'slug' })

    // Write suggested_slug for mis-filed documents, clear it for correctly-filed ones
    if (misfiledSuggestions.length > 0) {
      await Promise.all(
        misfiledSuggestions.map(({ documentId, targetSlug }) =>
          supabase
            .from('document_uploads')
            .update({ suggested_slug: targetSlug })
            .eq('id', documentId),
        ),
      )
    }

    // Clear stale suggestions for documents AI no longer flags
    const misfiledIds = new Set(misfiledSuggestions.map((s) => s.documentId))
    const allIds = [...Object.values(uploadsBySlug).flat(), ...extraUploads].map((u) => u.id)
    const toDeFlag = allIds.filter((id) => !misfiledIds.has(id))
    if (toDeFlag.length > 0) {
      await supabase
        .from('document_uploads')
        .update({ suggested_slug: null })
        .in('id', toDeFlag)
    }
  } catch (err) {
    // Background task — swallow errors so they never surface to the user
    console.error('[refreshAiCoverage] background check failed:', err)
  }
}
