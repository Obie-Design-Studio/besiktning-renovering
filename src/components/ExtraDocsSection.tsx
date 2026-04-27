'use client'

import { useState } from 'react'
import { InlineUploadForm } from '@/components/InlineUploadForm'
import { CommentThread } from '@/components/CommentThread'
import type { DocumentUpload } from '@/types/document'
import type { Comment } from '@/types/comment'

interface ExtraDocsSectionProps {
  uploads: DocumentUpload[]
  comments: Comment[]
}

function ExtraFile({ upload }: { upload: DocumentUpload }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{upload.upload_title}</p>
        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{upload.upload_description}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
          {upload.uploader_name} &nbsp;·&nbsp; {new Date(upload.uploaded_at).toLocaleDateString('sv-SE')}
        </p>
      </div>
      <a
        href={upload.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-xs font-medium"
        style={{ color: 'var(--accent)', textDecoration: 'underline', paddingTop: '2px' }}
      >
        Öppna →
      </a>
    </div>
  )
}

export function ExtraDocsSection({ uploads, comments }: ExtraDocsSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <section>
      <div className="flex items-baseline justify-between" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 className="font-semibold" style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>
            Övrig dokumentation
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)', marginTop: '0.15rem' }}>
            Bilagor och bakgrundsinformation som inte tillhör en specifik checklistpunkt
          </p>
        </div>
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            style={{ fontSize: '0.8125rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}
          >
            + Lägg till
          </button>
        )}
      </div>

      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem',
        }}
      >
        {uploads.length > 0 ? (
          <div>
            {uploads.map((upload) => (
              <ExtraFile key={upload.id} upload={upload} />
            ))}
          </div>
        ) : (
          !isFormOpen && (
            <p style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.875rem', color: 'var(--muted)' }}>
              Inga extra dokument uppladdade ännu.
            </p>
          )
        )}

        {isFormOpen && (
          <div style={{ marginTop: uploads.length > 0 ? '1rem' : '0' }}>
            <InlineUploadForm key="ovrig" slug="ovrig" onCancel={() => setIsFormOpen(false)} />
          </div>
        )}

        <div style={{ marginTop: uploads.length > 0 || isFormOpen ? '0.75rem' : '0', borderTop: uploads.length > 0 || isFormOpen ? '1px solid var(--border)' : 'none', paddingTop: uploads.length > 0 || isFormOpen ? '0.75rem' : '0' }}>
          <CommentThread slug="ovrig" comments={comments} />
        </div>
      </div>
    </section>
  )
}
