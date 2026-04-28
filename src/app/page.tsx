import { createSupabaseServer } from '@/lib/supabase'
import { InfoSection } from '@/components/InfoSection'
import { SmartUpload } from '@/components/SmartUpload'
import { ChecklistSection } from '@/components/ChecklistSection'
import { ExtraDocsSection } from '@/components/ExtraDocsSection'
import { StickyNav } from '@/components/StickyNav'
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
  // Gracefully handle missing comments table — falls back to empty until migration is applied
  const comments = commentsResult.error ? [] : (commentsResult.data as Comment[])

  const uploads = uploadsResult.data as DocumentUpload[]

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
      <StickyNav />
      <div id="nav-info"><InfoSection uploadButton={<SmartUpload />} /></div>
      <ChecklistSection uploadsBySlug={checklistUploadsBySlug} commentsBySlug={commentsBySlug} />
      <div id="nav-ovrig"><ExtraDocsSection uploads={extraUploads} comments={commentsBySlug[EXTRA_SLUG] ?? []} commentsBySlug={commentsBySlug} /></div>
    </>
  )
}
