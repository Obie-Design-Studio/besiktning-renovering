'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'
import { CHECKLIST_ITEMS } from '@/data/checklist-items'
import type { UploadDocumentState, UploaderName } from '@/types/document'

const STORAGE_BUCKET = 'inspection-pdfs'
const VALID_UPLOADERS: UploaderName[] = ['Tobias', 'Palmens byggservice']

export async function uploadDocument(
  _prevState: UploadDocumentState | null,
  formData: FormData,
): Promise<UploadDocumentState> {
  const slug = (formData.get('document_item_slug') as string | null)?.trim() ?? ''
  const uploadTitle = (formData.get('upload_title') as string | null)?.trim() ?? ''
  const uploadDescription = (formData.get('upload_description') as string | null)?.trim() ?? ''
  const uploaderName = (formData.get('uploader_name') as string | null) ?? ''
  const file = formData.get('file') as File | null
  const linkUrl = (formData.get('link_url') as string | null)?.trim() ?? ''

  const isValidSlug = slug === 'ovrig' || CHECKLIST_ITEMS.some((item) => item.slug === slug)
  if (!isValidSlug) return { error: 'Ogiltigt dokumentalternativ.' }

  if (!uploadTitle) return { error: 'Titel krävs.' }
  if (!uploadDescription) return { error: 'Beskrivning krävs.' }
  if (!VALID_UPLOADERS.includes(uploaderName as UploaderName)) {
    return { error: 'Välj vem som laddar upp.' }
  }

  const hasFile = Boolean(file && file.size > 0)
  const hasLink = linkUrl.length > 0
  if (!hasFile && !hasLink) return { error: 'Ladda upp en fil eller klistra in en länk.' }

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

    if (storageError) return { error: `Uppladdningsfel: ${storageError.message}` }

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)
    fileUrl = urlData.publicUrl
    fileName = file.name
  } else {
    fileUrl = linkUrl
    fileName = linkUrl.split('/').pop() ?? 'Extern länk'
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

  if (dbError) return { error: `Kunde inte spara: ${dbError.message}` }

  redirect('/')
}
