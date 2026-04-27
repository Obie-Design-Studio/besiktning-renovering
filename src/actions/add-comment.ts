'use server'

import { createSupabaseServer } from '@/lib/supabase'
import type { AddCommentState, CommentAuthor } from '@/types/comment'

const VALID_AUTHORS: CommentAuthor[] = ['Besiktningsman', 'Tobias', 'Palmens byggservice']

export async function addComment(
  _prev: AddCommentState | null,
  formData: FormData,
): Promise<AddCommentState> {
  const sectionSlug = (formData.get('section_slug') as string)?.trim()
  const authorName = (formData.get('author_name') as string)?.trim()
  const message = (formData.get('message') as string)?.trim()

  if (!sectionSlug) return { error: 'Sektion saknas.' }
  if (!VALID_AUTHORS.includes(authorName as CommentAuthor)) return { error: 'Välj vem du är.' }
  if (!message) return { error: 'Meddelandet får inte vara tomt.' }
  if (message.length > 2000) return { error: 'Meddelandet är för långt (max 2000 tecken).' }

  const supabase = createSupabaseServer()
  const { error } = await supabase.from('comments').insert({
    section_slug: sectionSlug,
    author_name: authorName,
    message,
  })

  if (error) return { error: `Kunde inte spara: ${error.message}` }
  return { success: true }
}
