'use server'

import { createSupabaseServer } from '@/lib/supabase'

const STORAGE_BUCKET = 'inspection-pdfs'

export interface CreateUploadUrlResult {
  path: string
  token: string
  signedUrl: string
}

/**
 * Generates a short-lived signed upload URL so the browser can write a file
 * directly to Supabase Storage without routing bytes through a Vercel function.
 */
export async function createUploadUrl(
  fileName: string,
): Promise<CreateUploadUrlResult | { error: string }> {
  const supabase = createSupabaseServer()
  const ext = fileName.split('.').pop() ?? 'pdf'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) {
    return { error: error?.message ?? 'Kunde inte skapa uppladdningslänk.' }
  }

  return { path, token: data.token, signedUrl: data.signedUrl }
}
