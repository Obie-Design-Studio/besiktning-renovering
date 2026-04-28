'use server'

import { createSupabaseServer } from '@/lib/supabase'

export async function updateDocument(
  documentId: string,
  title: string,
  description: string,
): Promise<{ success: boolean; error?: string }> {
  if (!documentId) return { success: false, error: 'Inget dokument-ID angivet.' }
  if (!title.trim()) return { success: false, error: 'Titel får inte vara tom.' }

  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('document_uploads')
    .update({ upload_title: title.trim(), upload_description: description.trim() })
    .eq('id', documentId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
