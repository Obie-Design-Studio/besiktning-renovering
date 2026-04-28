import JSZip from 'jszip'
import { createSupabaseServer } from '@/lib/supabase'
import { CHECKLIST_ITEMS } from '@/data/checklist-items'

// Allow up to 60 seconds — large PDF collections can take a while to fetch and zip
export const maxDuration = 60

function safe(str: string): string {
  return str.replace(/[/\\:*?"<>|]/g, '-').trim()
}

function categoryLabel(slug: string): string {
  if (slug === 'ovrig') return 'Ovrig dokumentation'
  const item = CHECKLIST_ITEMS.find((i) => i.slug === slug)
  return item ? safe(item.category) : 'Okand kategori'
}

export async function GET() {
  try {
    const supabase = createSupabaseServer()

    const { data: docs, error } = await supabase
      .from('document_uploads')
      .select('*')
      .order('uploaded_at', { ascending: true }) // column is uploaded_at, not created_at

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    if (!docs || docs.length === 0) {
      return Response.json({ error: 'Inga dokument uppladdade ännu.' }, { status: 404 })
    }

    const zip = new JSZip()
    const linkLines: string[] = [
      'DOKUMENTLÄNKAR',
      '==============',
      'Nedanstående dokument är externa länkar och ingår inte i ZIP-filen.',
      '',
    ]
    let hasLinks = false

    // Fetch all uploaded files in parallel for speed
    await Promise.all(
      docs.map(async (doc) => {
        const folder = categoryLabel(doc.document_item_slug)
        const title = safe(doc.upload_title || doc.file_name || 'dokument')

        if (doc.file_source === 'upload' && doc.file_url) {
          try {
            const res = await fetch(doc.file_url)
            if (!res.ok) return
            const buffer = await res.arrayBuffer()
            const ext = doc.file_name?.split('.').pop() ?? 'pdf'
            zip.file(`${folder}/${title}.${ext}`, buffer)
          } catch {
            // Skip files that fail to fetch — don't abort the whole ZIP
          }
        } else if (doc.file_source === 'link' && doc.file_url) {
          hasLinks = true
          linkLines.push(`[${folder}] ${doc.upload_title}`)
          linkLines.push(`  ${doc.file_url}`)
          linkLines.push('')
        }
      }),
    )

    if (hasLinks) {
      zip.file('_lankar.txt', linkLines.join('\n'))
    }

    const zipBytes = await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    return new Response(zipBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="besiktningsdokument.zip"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Oväntat fel'
    return Response.json({ error: msg }, { status: 500 })
  }
}
