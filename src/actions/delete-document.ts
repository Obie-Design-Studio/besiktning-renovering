'use server'

import { createSupabaseServer } from '@/lib/supabase'

const STORAGE_BUCKET = 'inspection-pdfs'

export interface DeleteDocumentResult {
  success: boolean
  error?: string
}

export async function deleteDocument(id: string): Promise<DeleteDocumentResult> {
  if (!id) return { success: false, error: 'Dokument-ID saknas.' }

  const supabase = createSupabaseServer()

  const { data, error: fetchError } = await supabase
    .from('document_uploads')
    .select('id, file_url, file_source')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !data) {
    return { success: false, error: 'Dokumentet hittades inte.' }
  }

  // Remove the stored file from Supabase Storage if it was uploaded (not a link)
  if (data.file_source === 'upload') {
    const marker = `/object/public/${STORAGE_BUCKET}/`
    const markerIndex = data.file_url.indexOf(marker)
    if (markerIndex !== -1) {
      const storagePath = data.file_url.slice(markerIndex + marker.length)
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
    }
  }

  const { error: deleteError } = await supabase
    .from('document_uploads')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return { success: false, error: `Kunde inte ta bort: ${deleteError.message}` }
  }

  return { success: true }
}
