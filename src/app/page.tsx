import { unstable_noStore as noStore } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase'
import { InfoSection } from '@/components/InfoSection'
import { SmartUpload } from '@/components/SmartUpload'
import { ChecklistSection } from '@/components/ChecklistSection'
import { ExtraDocsSection } from '@/components/ExtraDocsSection'
import { StickyNav } from '@/components/StickyNav'
import { UploadLog } from '@/components/UploadLog'
import { NAV_ITEMS } from '@/data/nav-items'
import { CHECKLIST_ITEMS, CATEGORY_NAV_ID } from '@/data/checklist-items'
import type { DocumentUpload } from '@/types/document'
import type { Comment } from '@/types/comment'

const EXTRA_SLUG = 'ovrig'

interface PageData {
  checklistUploadsBySlug: Record<string, DocumentUpload[]>
  extraUploads: DocumentUpload[]
  commentsBySlug: Record<string, Comment[]>
  navCounts: Record<string, number>
  navMissingRequired: Record<string, number>
}

async function fetchPageData(): Promise<PageData> {
  noStore() // always fetch fresh data — never serve cached Supabase results
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

  // Compute per-nav-item upload counts for the sticky navigation
  const navCounts: Record<string, number> = {}
  const navMissingRequired: Record<string, number> = {}
  for (const navItem of NAV_ITEMS) {
    navCounts[navItem.id] = 0
    navMissingRequired[navItem.id] = 0
  }

  for (const item of CHECKLIST_ITEMS) {
    const navId = CATEGORY_NAV_ID[item.category]
    if (!navId) continue
    navCounts[navId] = (navCounts[navId] ?? 0) + (checklistUploadsBySlug[item.slug]?.length ?? 0)
    if (item.required && (checklistUploadsBySlug[item.slug]?.length ?? 0) === 0) {
      navMissingRequired[navId] = (navMissingRequired[navId] ?? 0) + 1
    }
  }
  navCounts['nav-ovrig'] = extraUploads.length

  return { checklistUploadsBySlug, extraUploads, commentsBySlug, navCounts, navMissingRequired }
}

export default async function HomePage() {
  const { checklistUploadsBySlug, extraUploads, commentsBySlug, navCounts, navMissingRequired } = await fetchPageData()

  return (
    <>
      <StickyNav counts={navCounts} missingRequired={navMissingRequired} />
      <div id="nav-info"><InfoSection uploadButton={<SmartUpload />} /></div>
      <ChecklistSection uploadsBySlug={checklistUploadsBySlug} commentsBySlug={commentsBySlug} />
      <div id="nav-ovrig"><ExtraDocsSection uploads={extraUploads} comments={commentsBySlug[EXTRA_SLUG] ?? []} commentsBySlug={commentsBySlug} /></div>
      <UploadLog />
    </>
  )
}
