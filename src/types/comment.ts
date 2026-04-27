export type CommentAuthor = 'Besiktningsman' | 'Tobias' | 'Palmens byggservice'

export interface Comment {
  id: string
  section_slug: string
  author_name: CommentAuthor
  message: string
  created_at: string
}

export interface AddCommentState {
  error?: string
  success?: boolean
}
