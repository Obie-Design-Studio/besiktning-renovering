import { createSupabaseServer } from '@/lib/supabase'
import { InfoSection } from '@/components/InfoSection'
import { SmartUpload } from '@/components/SmartUpload'
import { ChecklistSection } from '@/components/ChecklistSection'
import { ExtraDocsSection } from '@/components/ExtraDocsSection'
import type { DocumentUpload } from '@/types/document'
import type { Comment } from '@/types/comment'

const EXTRA_SLUG = 'ovrig'

interface PageData {
  checklistUploadsBySlug: Record<string, DocumentUpload[]>
  extraUploads: DocumentUpload[]
  commentsBySlug: Record<string, Comment[]>
}

async function fetchPageData(): Promise<PageData> {
  const supabase = createSupabaseServer()

  const [uploadsResult, commentsResult] = await Promise.all([
    supabase.from('document_uploads').select('*').order('uploaded_at', { ascending: true }),
    supabase.from('comments').select('*').order('created_at', { ascending: true }),
  ])

  if (uploadsResult.error) throw new Error(`Kunde inte hämta uppladdningar: ${uploadsResult.error.message}`)
  if (commentsResult.error) throw new Error(`Kunde inte hämta kommentarer: ${commentsResult.error.message}`)

  const uploads = uploadsResult.data as DocumentUpload[]
  const comments = commentsResult.data as Comment[]

  const checklistUploadsBySlug: Record<string, DocumentUpload[]> = {}
  const extraUploads: DocumentUpload[] = []

  for (const upload of uploads) {
    if (upload.document_item_slug === EXTRA_SLUG) {
      extraUploads.push(upload)
    } else {
      const existing = checklistUploadsBySlug[upload.document_item_slug] ?? []
      checklistUploadsBySlug[upload.document_item_slug] = [...existing, upload]
    }
  }

  const commentsBySlug: Record<string, Comment[]> = {}
  for (const comment of comments) {
    const existing = commentsBySlug[comment.section_slug] ?? []
    commentsBySlug[comment.section_slug] = [...existing, comment]
  }

  return { checklistUploadsBySlug, extraUploads, commentsBySlug }
}

export default async function HomePage() {
  const { checklistUploadsBySlug, extraUploads, commentsBySlug } = await fetchPageData()

  return (
    <>
      <InfoSection uploadButton={<SmartUpload />} />
      <ChecklistSection uploadsBySlug={checklistUploadsBySlug} commentsBySlug={commentsBySlug} />
      <ExtraDocsSection uploads={extraUploads} comments={commentsBySlug[EXTRA_SLUG] ?? []} />
    </>
  )
}
