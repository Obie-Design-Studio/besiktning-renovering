import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { isTobiasSession } from '@/lib/server-identity'
import { resolveAiMandatoryCoverage } from '@/lib/mandatory-coverage-ai'
import type { DocumentUpload } from '@/types/document'

export const maxDuration = 60

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isTobiasSession())) {
    return NextResponse.json({ error: 'Endast Tobias kan köra AI-granskning.' }, { status: 403 })
  }

  const supabase = createSupabaseServer()

  const { data: uploads, error } = await supabase
    .from('document_uploads')
    .select('*')
    .order('uploaded_at', { ascending: true })

  if (error || !uploads) {
    return NextResponse.json({ error: 'Kunde inte hämta dokument.' }, { status: 500 })
  }

  const uploadsBySlug: Record<string, DocumentUpload[]> = {}
  const extraUploads: DocumentUpload[] = []
  for (const u of uploads as DocumentUpload[]) {
    if (u.document_item_slug === 'ovrig') {
      extraUploads.push(u)
    } else {
      uploadsBySlug[u.document_item_slug] = [...(uploadsBySlug[u.document_item_slug] ?? []), u]
    }
  }

  const { satisfiedSlugs, misfiledSuggestions } = await resolveAiMandatoryCoverage(uploadsBySlug, extraUploads)

  // Determine all required slugs so we can write covered=false for uncovered ones too
  const { CHECKLIST_ITEMS } = await import('@/data/checklist-items')
  const requiredSlugs = CHECKLIST_ITEMS.filter((i) => i.required).map((i) => i.slug)
  const satisfiedSet = new Set(satisfiedSlugs)

  const cacheRows = requiredSlugs.map((slug) => ({
    slug,
    covered: satisfiedSet.has(slug),
    checked_at: new Date().toISOString(),
  }))

  const { error: upsertError } = await supabase
    .from('ai_coverage_cache')
    .upsert(cacheRows, { onConflict: 'slug' })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // Write suggested_slug for mis-filed documents
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

  return NextResponse.json({ satisfiedSlugs, misfiledCount: misfiledSuggestions.length, checkedAt: new Date().toISOString() })
}
