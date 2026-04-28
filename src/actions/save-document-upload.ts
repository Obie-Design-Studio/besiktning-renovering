'use server'

import { createSupabaseServer } from '@/lib/supabase'
import { CHECKLIST_ITEMS } from '@/data/checklist-items'
import { hashFile } from '@/lib/hash-file'
import type { UploaderName } from '@/types/document'

const STORAGE_BUCKET = 'inspection-pdfs'
const VALID_UPLOADERS: UploaderName[] = ['Tobias', 'Palmens byggservice']

export interface SaveDocumentInput {
  slug: string
  uploadTitle: string
  uploadDescription: string
  uploaderName: string
  // Preferred path: file was already uploaded directly to storage by the browser.
  // Only the metadata needs to pass through the server action.
  storagePath?: string
  fileName?: string
  contentHash?: string
  // URL import: server fetches and stores the PDF
  linkUrl?: string
  // Legacy: raw file bytes through the server action (kept for compatibility)
  file?: File | null
}

export interface SaveDocumentResult {
  success: boolean
  error?: string
}

export async function saveDocumentUpload(input: SaveDocumentInput): Promise<SaveDocumentResult> {
  const { slug, uploadTitle, uploadDescription, uploaderName, file, linkUrl, storagePath, fileName, contentHash } = input

  const isValidSlug = slug === 'ovrig' || CHECKLIST_ITEMS.some((item) => item.slug === slug)
  if (!isValidSlug) return { success: false, error: 'Ogiltigt dokumentalternativ.' }
  if (!uploadTitle.trim()) return { success: false, error: 'Titel krävs.' }
  if (!uploadDescription.trim()) return { success: false, error: 'Beskrivning krävs.' }
  if (!VALID_UPLOADERS.includes(uploaderName as UploaderName)) {
    return { success: false, error: 'Välj vem som laddar upp.' }
  }

  const hasPreUploaded = Boolean(storagePath?.trim())
  const hasFile = Boolean(file && file.size > 0)
  const hasLink = Boolean(linkUrl?.trim())
  if (!hasPreUploaded && !hasFile && !hasLink) return { success: false, error: 'Fil eller länk krävs.' }

  const supabase = createSupabaseServer()

  // Fast path: file was already uploaded directly to Supabase Storage by the browser.
  // The server only needs to check for duplicates and insert the metadata row.
  if (hasPreUploaded) {
    if (contentHash) {
      const { data: existing } = await supabase
        .from('document_uploads')
        .select('upload_title')
        .eq('content_hash', contentHash)
        .maybeSingle()
      if (existing) {
        return { success: false, error: `Den här filen finns redan uppladdad som "${existing.upload_title}".` }
      }
    }

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath!)
    const { error: dbError } = await supabase.from('document_uploads').insert({
      document_item_slug: slug,
      file_url: urlData.publicUrl,
      file_name: fileName ?? storagePath,
      file_source: 'upload',
      upload_title: uploadTitle,
      upload_description: uploadDescription,
      uploader_name: uploaderName,
      content_hash: contentHash ?? null,
    })

    if (dbError) return { success: false, error: `Kunde inte spara: ${dbError.message}` }
    return { success: true }
  }

  // Duplicate detection — check content hash before uploading to storage
  let contentHash: string | null = null
  if (hasFile && file) {
    contentHash = await hashFile(file)
    const { data: existing } = await supabase
      .from('document_uploads')
      .select('upload_title')
      .eq('content_hash', contentHash)
      .maybeSingle()
    if (existing) {
      return { success: false, error: `Den här filen finns redan uppladdad som "${existing.upload_title}".` }
    }
  }

  let fileUrl: string
  let fileName: string

  if (hasFile && file) {
    // Direct file upload
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
    // URL import — download the PDF and store it in Supabase Storage so it
    // is permanently safe regardless of whether the source URL stays alive
    const trimmedUrl = linkUrl!.trim()
    fileName = trimmedUrl.split('/').pop()?.split('?')[0] ?? 'dokument.pdf'
    if (!fileName.endsWith('.pdf')) fileName += '.pdf'

    let fetchedBuffer: ArrayBuffer
    try {
      const res = await fetch(trimmedUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      fetchedBuffer = await res.arrayBuffer()
    } catch (err) {
      // If we can't download the PDF, fall back to storing just the link
      const { error: dbError } = await supabase.from('document_uploads').insert({
        document_item_slug: slug,
        file_url: trimmedUrl,
        file_name: fileName,
        file_source: 'link',
        upload_title: uploadTitle,
        upload_description: uploadDescription,
        uploader_name: uploaderName,
        content_hash: null,
      })
      if (dbError) return { success: false, error: `Kunde inte spara: ${dbError.message}` }
      return { success: true }
    }

    // Compute hash for duplicate detection
    const { createHash } = await import('crypto')
    contentHash = createHash('sha256').update(Buffer.from(fetchedBuffer)).digest('hex')

    const { data: existing } = await supabase
      .from('document_uploads')
      .select('upload_title')
      .eq('content_hash', contentHash)
      .maybeSingle()
    if (existing) {
      return { success: false, error: `Den här filen finns redan uppladdad som "${existing.upload_title}".` }
    }

    const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fetchedBuffer, { contentType: 'application/pdf' })

    if (storageError) return { success: false, error: `Uppladdningsfel: ${storageError.message}` }

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)
    fileUrl = urlData.publicUrl
  }

  const { error: dbError } = await supabase.from('document_uploads').insert({
    document_item_slug: slug,
    file_url: fileUrl,
    file_name: fileName,
    file_source: 'upload',
    upload_title: uploadTitle,
    upload_description: uploadDescription,
    uploader_name: uploaderName,
    content_hash: contentHash,
  })

  if (dbError) return { success: false, error: `Kunde inte spara: ${dbError.message}` }

  return { success: true }
}
