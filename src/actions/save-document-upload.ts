'use server'

import { createSupabaseServer } from '@/lib/supabase'
import { CHECKLIST_ITEMS } from '@/data/checklist-items'
import type { UploaderName } from '@/types/document'

const STORAGE_BUCKET = 'inspection-pdfs'
const VALID_UPLOADERS: UploaderName[] = ['Tobias', 'Palmens byggservice']

export interface SaveDocumentInput {
  slug: string
  uploadTitle: string
  uploadDescription: string
  uploaderName: string
  file?: File | null
  linkUrl?: string
}

export interface SaveDocumentResult {
  success: boolean
  error?: string
}

export async function saveDocumentUpload(input: SaveDocumentInput): Promise<SaveDocumentResult> {
  const { slug, uploadTitle, uploadDescription, uploaderName, file, linkUrl } = input

  const isValidSlug = slug === 'ovrig' || CHECKLIST_ITEMS.some((item) => item.slug === slug)
  if (!isValidSlug) return { success: false, error: 'Ogiltigt dokumentalternativ.' }
  if (!uploadTitle.trim()) return { success: false, error: 'Titel krävs.' }
  if (!uploadDescription.trim()) return { success: false, error: 'Beskrivning krävs.' }
  if (!VALID_UPLOADERS.includes(uploaderName as UploaderName)) {
    return { success: false, error: 'Välj vem som laddar upp.' }
  }

  const hasFile = Boolean(file && file.size > 0)
  const hasLink = Boolean(linkUrl?.trim())
  if (!hasFile && !hasLink) return { success: false, error: 'Fil eller länk krävs.' }

  const supabase = createSupabaseServer()

  let fileUrl: string
  let fileName: string
  const fileSource: 'upload' | 'link' = hasFile ? 'upload' : 'link'

  if (hasFile && file) {
    const extension = file.name.split('.').pop() ?? 'pdf'
    const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, { contentType: file.type })

    if (storageError) return { success: false, error: `Uppladdningsfel: ${storageError.message}` }

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)
    fileUrl = urlData.publicUrl
    fileName = file.name
  } else {
    fileUrl = linkUrl!.trim()
    fileName = linkUrl!.trim().split('/').pop() ?? 'Extern länk'
  }

  const { error: dbError } = await supabase.from('document_uploads').insert({
    document_item_slug: slug,
    file_url: fileUrl,
    file_name: fileName,
    file_source: fileSource,
    upload_title: uploadTitle,
    upload_description: uploadDescription,
    uploader_name: uploaderName,
  })

  if (dbError) return { success: false, error: `Kunde inte spara: ${dbError.message}` }

  return { success: true }
}
