import { cookies } from 'next/headers'
import { unstable_noStore as noStore } from 'next/cache'
import { COOKIE_NAME } from '@/lib/identity'
import { createSupabaseServer } from '@/lib/supabase'
import { CHECKLIST_ITEMS } from '@/data/checklist-items'
import type { DocumentUpload } from '@/types/document'

const slugToCategory: Record<string, string> = Object.fromEntries(
  CHECKLIST_ITEMS.map((item) => [item.slug, item.category]),
)
slugToCategory['ovrig'] = 'Övrig dokumentation'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Stockholm',
  })
}

export async function UploadLog() {
  const cookieStore = await cookies()
  const identity = cookieStore.get(COOKIE_NAME)?.value
  if (identity !== 'Tobias') return null

  noStore()
  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('document_uploads')
    .select('*')
    .order('uploaded_at', { ascending: false })

  if (error || !data) return null

  const uploads = data as DocumentUpload[]

  return (
    <section style={{ marginTop: '3rem', marginBottom: '3rem' }}>
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--muted)', marginBottom: '1rem' }}
      >
        Uppladdningslogg
      </p>

      {uploads.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Inga uppladdningar ännu.
        </p>
      ) : (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {uploads.map((u, i) => (
            <div
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4"
              style={{
                padding: '0.875rem 1.25rem',
                borderBottom: i < uploads.length - 1 ? '1px solid var(--border)' : undefined,
              }}
            >
              <span
                className="text-xs shrink-0 font-mono"
                style={{ color: 'var(--muted)', minWidth: '10rem', paddingTop: '1px' }}
              >
                {formatDate(u.uploaded_at)}
              </span>
              <span
                className="text-xs shrink-0"
                style={{
                  color: 'var(--muted)',
                  minWidth: '7rem',
                  paddingTop: '1px',
                }}
              >
                {u.uploader_name}
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--foreground)' }}
                  title={u.upload_title || u.file_name}
                >
                  {u.upload_title || u.file_name}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {slugToCategory[u.document_item_slug] ?? u.document_item_slug}
                  {u.file_name && u.upload_title && u.file_name !== u.upload_title && (
                    <> &nbsp;·&nbsp; {u.file_name}</>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
