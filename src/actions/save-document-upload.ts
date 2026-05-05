'use server'

import { after } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { CHECKLIST_ITEMS } from '@/data/checklist-items'
import { hashFile } from '@/lib/hash-file'
import { refreshAiCoverageInBackground } from '@/lib/refresh-ai-coverage'
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
    after(refreshAiCoverageInBackground())
    return { success: true }
  }

  // Legacy paths: either raw file bytes or URL import —
  // both still route through the server (kept for compatibility and URL imports)
  let legacyHash: string | null = null
  let legacyFileUrl: string
  let legacyFileName: string

  if (hasFile && file) {
    // Duplicate check before uploading
    legacyHash = await hashFile(file)
    const { data: existing } = await supabase
      .from('document_uploads')
      .select('upload_title')
      .eq('content_hash', legacyHash)
      .maybeSingle()
    if (existing) {
      return { success: false, error: `Den här filen finns redan uppladdad som "${existing.upload_title}".` }
    }

    // Direct file upload (legacy — only works for files < 4.5 MB on Vercel)
    const extension = file.name.split('.').pop() ?? 'pdf'
    const legacyPath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(legacyPath, file, { contentType: file.type })

    if (storageError) return { success: false, error: `Uppladdningsfel: ${storageError.message}` }

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(legacyPath)
    legacyFileUrl = urlData.publicUrl
    legacyFileName = file.name
  } else {
    // URL import — download the PDF and store it in Supabase Storage so it
    // is permanently safe regardless of whether the source URL stays alive
    const trimmedUrl = linkUrl!.trim()
    legacyFileName = trimmedUrl.split('/').pop()?.split('?')[0] ?? 'dokument.pdf'
    if (!legacyFileName.endsWith('.pdf')) legacyFileName += '.pdf'

    let fetchedBuffer: ArrayBuffer
    try {
      const res = await fetch(trimmedUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      fetchedBuffer = await res.arrayBuffer()
    } catch {
      // If we can't download the PDF, fall back to storing just the link
      const { error: dbError } = await supabase.from('document_uploads').insert({
        document_item_slug: slug,
        file_url: trimmedUrl,
        file_name: legacyFileName,
        file_source: 'link',
        upload_title: uploadTitle,
        upload_description: uploadDescription,
        uploader_name: uploaderName,
        content_hash: null,
      })
      if (dbError) return { success: false, error: `Kunde inte spara: ${dbError.message}` }
      after(refreshAiCoverageInBackground())
      return { success: true }
    }

    // Compute hash for duplicate detection
    const { createHash } = await import('crypto')
    legacyHash = createHash('sha256').update(Buffer.from(fetchedBuffer)).digest('hex')

    const { data: existing } = await supabase
      .from('document_uploads')
      .select('upload_title')
      .eq('content_hash', legacyHash)
      .maybeSingle()
    if (existing) {
      return { success: false, error: `Den här filen finns redan uppladdad som "${existing.upload_title}".` }
    }

    const legacyPath = `${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(legacyPath, fetchedBuffer, { contentType: 'application/pdf' })

    if (storageError) return { success: false, error: `Uppladdningsfel: ${storageError.message}` }

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(legacyPath)
    legacyFileUrl = urlData.publicUrl
  }

  const { error: dbError } = await supabase.from('document_uploads').insert({
    document_item_slug: slug,
    file_url: legacyFileUrl!,
    file_name: legacyFileName!,
    file_source: 'upload',
    upload_title: uploadTitle,
    upload_description: uploadDescription,
    uploader_name: uploaderName,
    content_hash: legacyHash,
  })

  if (dbError) return { success: false, error: `Kunde inte spara: ${dbError.message}` }

  after(refreshAiCoverageInBackground())
  return { success: true }
}
