'use server'

import { createSupabaseServer } from '@/lib/supabase'
import { isTobiasSession } from '@/lib/server-identity'
import type { UploaderName } from '@/types/document'

const VALID: UploaderName[] = ['Tobias', 'Palmens byggservice']

export async function updateDocumentUploader(
  documentId: string,
  uploaderName: UploaderName,
): Promise<{ success: boolean; error?: string }> {
  if (!(await isTobiasSession())) {
    return { success: false, error: 'Endast Tobias kan ändra uppladdare.' }
  }
  if (!documentId) return { success: false, error: 'Inget dokument-ID.' }
  if (!VALID.includes(uploaderName)) return { success: false, error: 'Ogiltig uppladdare.' }

  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('document_uploads')
    .update({ uploader_name: uploaderName })
    .eq('id', documentId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
