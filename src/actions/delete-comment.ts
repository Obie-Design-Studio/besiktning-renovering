'use server'

import { createSupabaseServer } from '@/lib/supabase'

export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  if (!commentId) return { success: false, error: 'Inget kommentar-ID angivet.' }

  const supabase = createSupabaseServer()
  const { error } = await supabase.from('comments').delete().eq('id', commentId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
