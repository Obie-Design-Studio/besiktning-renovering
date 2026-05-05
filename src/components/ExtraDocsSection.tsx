'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { InlineUploadForm } from '@/components/InlineUploadForm'
import { CommentThread } from '@/components/CommentThread'
import { DeleteButton } from '@/components/DeleteButton'
import { DocumentUploaderMeta } from '@/components/DocumentUploaderMeta'
import { SectionCompleteToggle } from '@/components/SectionCompleteToggle'
import { updateDocument } from '@/actions/update-document'
import { useIdentityContext } from '@/context/IdentityContext'
import type { DocumentUpload } from '@/types/document'
import type { Comment } from '@/types/comment'

interface ExtraDocsSectionProps {
  uploads: DocumentUpload[]
  comments: Comment[]
  commentsBySlug: Record<string, Comment[]>
  /** Tobias kan markera övrig dokumentation som klar */
  sectionCompleted?: boolean
}

function ExtraFile({
  upload,
  fileComments,
}: {
  upload: DocumentUpload
  fileComments: Comment[]
}) {
  const { identity } = useIdentityContext()
  const router = useRouter()
  const isTobias = identity === 'Tobias'

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(upload.upload_title)
  const [editDesc, setEditDesc] = useState(upload.upload_description ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSave() {
    setSaveError(null)
    setIsSaving(true)
    const result = await updateDocument(upload.id, editTitle, editDesc)
    setIsSaving(false)
    if (result.success) {
      setIsEditing(false)
      router.refresh()
    } else {
      setSaveError(result.error ?? 'Kunde inte spara.')
    }
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.875rem', marginTop: '0' }}>
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input
            type="text"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            disabled={isSaving}
            style={{ width: '100%', borderRadius: '6px', border: '1.5px solid var(--accent)', background: 'var(--background)', padding: '0.375rem 0.625rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)', outline: 'none' }}
          />
          <textarea
            rows={2}
            value={editDesc}
            onChange={e => setEditDesc(e.target.value)}
            disabled={isSaving}
            style={{ width: '100%', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', padding: '0.375rem 0.625rem', fontSize: '0.75rem', color: 'var(--foreground)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
          />
          {saveError && <p style={{ fontSize: '0.75rem', color: '#DC2626' }}>{saveError}</p>}
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSave} disabled={isSaving || !editTitle.trim()}
              style={{ padding: '0.3rem 0.875rem', borderRadius: '6px', background: 'var(--foreground)', color: 'var(--card)', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1 }}>
              {isSaving ? 'Sparar…' : 'Spara'}
            </button>
            <button type="button" onClick={() => { setIsEditing(false); setEditTitle(upload.upload_title); setEditDesc(upload.upload_description ?? '') }}
              style={{ padding: '0.3rem 0.875rem', borderRadius: '6px', background: 'none', color: 'var(--muted)', fontSize: '0.75rem', border: '1px solid var(--border)', cursor: 'pointer' }}>
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {upload.upload_title}
            </p>
            {upload.upload_description && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
                {upload.upload_description}
              </p>
            )}
            <p className="text-xs mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5" style={{ color: 'var(--muted)' }}>
              <DocumentUploaderMeta upload={upload} />
              <span aria-hidden="true">&nbsp;·&nbsp;</span>
              <span>{new Date(upload.uploaded_at).toLocaleDateString('sv-SE')}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0" style={{ paddingTop: '2px' }}>
            {isTobias && (
              <button type="button" onClick={() => setIsEditing(true)}
                style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Redigera
              </button>
            )}
            <a href={upload.file_url} target="_blank" rel="noopener noreferrer"
              className="text-xs font-medium" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              Läs dokument →
            </a>
            <DeleteButton documentId={upload.id} documentTitle={upload.upload_title} />
          </div>
        </div>
      )}
      <CommentThread slug={`file:${upload.id}`} comments={fileComments} />
    </div>
  )
}

export function ExtraDocsSection({
  uploads,
  comments,
  commentsBySlug,
  sectionCompleted = false,
}: ExtraDocsSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3" style={{ marginBottom: '1.25rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="font-semibold" style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>
            Övrig dokumentation
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)', marginTop: '0.15rem' }}>
            Bilagor och bakgrundsinformation som inte tillhör en specifik checklistpunkt
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexShrink: 0 }}>
          <SectionCompleteToggle navId="nav-ovrig" completed={sectionCompleted} />
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
              <ExtraFile
                key={upload.id}
                upload={upload}
                fileComments={commentsBySlug[`file:${upload.id}`] ?? []}
              />
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

        {/* Section-level comment thread */}
        <div style={{ borderTop: uploads.length > 0 || isFormOpen ? '1px solid var(--border)' : 'none', marginTop: uploads.length > 0 || isFormOpen ? '0.875rem' : '0', paddingTop: uploads.length > 0 || isFormOpen ? '0.875rem' : '0' }}>
          <CommentThread slug="ovrig" comments={comments} />
        </div>
      </div>
    </section>
  )
}
