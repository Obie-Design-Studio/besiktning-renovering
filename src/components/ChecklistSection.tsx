'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHECKLIST_ITEMS, groupItemsByCategory, CATEGORY_NAV_ID, type ChecklistItem } from '@/data/checklist-items'
import { InlineUploadForm } from '@/components/InlineUploadForm'
import { CommentThread } from '@/components/CommentThread'
import { DeleteButton } from '@/components/DeleteButton'
import { updateDocument } from '@/actions/update-document'
import { useIdentityContext } from '@/context/IdentityContext'
import type { DocumentUpload } from '@/types/document'
import type { Comment } from '@/types/comment'

interface ChecklistSectionProps {
  uploadsBySlug: Record<string, DocumentUpload[]>
  commentsBySlug: Record<string, Comment[]>
}

function UploadedFile({
  upload,
  comments,
}: {
  upload: DocumentUpload
  comments: Comment[]
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
    <div style={{ paddingTop: '0.875rem' }}>
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
            <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
              {upload.uploader_name} &nbsp;·&nbsp;{' '}
              {new Date(upload.uploaded_at).toLocaleDateString('sv-SE')}
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
      <CommentThread slug={`file:${upload.id}`} comments={comments} />
    </div>
  )
}

interface ChecklistItemRowProps {
  item: ChecklistItem
  uploads: DocumentUpload[]
  commentsBySlug: Record<string, Comment[]>
  isActive: boolean
  onToggle: () => void
}

function ChecklistItemRow({ item, uploads, commentsBySlug, isActive, onToggle }: ChecklistItemRowProps) {
  const hasUploads = uploads.length > 0
  const sectionComments = commentsBySlug[item.slug] ?? []

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }} className="last:border-0">
      <div className="flex items-start gap-4 py-4">
        {/* Status dot */}
        <div style={{ marginTop: '2px', flexShrink: 0 }}>
          {hasUploads ? (
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-label="Klar">
                <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : item.required ? (
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Obligatoriskt dokument saknas">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-label="Obligatoriskt">
                <path d="M5 2.5V5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="5" cy="7.5" r="0.75" fill="white" />
              </svg>
            </div>
          ) : (
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid var(--border)', background: 'transparent' }} aria-label="Saknas" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{item.description}</p>

          {/* Uploaded files — each with its own comment thread */}
          {hasUploads && (
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.75rem' }}>
              {uploads.map((upload) => (
                <UploadedFile
                  key={upload.id}
                  upload={upload}
                  comments={commentsBySlug[`file:${upload.id}`] ?? []}
                />
              ))}
            </div>
          )}

          {/* Section-level comment thread — only shown when no files uploaded yet */}
          {!hasUploads && <CommentThread slug={item.slug} comments={sectionComments} />}
        </div>

        {/* Upload action */}
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 text-xs font-medium transition-colors"
          style={{
            color: isActive ? 'var(--muted)' : 'var(--accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 0',
            textDecoration: 'underline',
          }}
        >
          {isActive ? 'Avbryt' : hasUploads ? '+ Lägg till' : '+ Ladda upp'}
        </button>
      </div>

      {isActive && (
        <div style={{ paddingBottom: '1.5rem' }}>
          <InlineUploadForm key={item.slug} slug={item.slug} onCancel={onToggle} />
        </div>
      )}
    </div>
  )
}

export function ChecklistSection({ uploadsBySlug, commentsBySlug }: ChecklistSectionProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  const uploadedCount = CHECKLIST_ITEMS.filter(
    (item) => (uploadsBySlug[item.slug]?.length ?? 0) > 0,
  ).length
  const totalCount = CHECKLIST_ITEMS.length

  function handleToggle(slug: string) {
    setActiveSlug((current) => (current === slug ? null : slug))
  }

  const groupedItems = groupItemsByCategory(CHECKLIST_ITEMS)

  return (
    <section style={{ marginBottom: '3rem' }}>
      <div className="flex items-baseline justify-between" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 className="font-semibold" style={{ fontSize: '1.1rem', color: 'var(--foreground)' }}>
            Dokumentation
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)', marginTop: '0.15rem' }}>
            Handlingar inlämnade i {uploadedCount} av {totalCount} områden
          </p>
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: uploadedCount === totalCount ? '#16A34A' : 'var(--muted)',
            background: uploadedCount === totalCount ? '#F0FDF4' : 'var(--background)',
            border: `1px solid ${uploadedCount === totalCount ? '#BBF7D0' : 'var(--border)'}`,
            borderRadius: '6px',
            padding: '3px 10px',
          }}
        >
          {uploadedCount}/{totalCount}
        </div>
      </div>

      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {groupedItems.map(([category, items], groupIdx) => {
          const hasMissingRequired = items.some(
            (item) => item.required && (uploadsBySlug[item.slug]?.length ?? 0) === 0
          )
          return (
          <div
            key={category}
            id={CATEGORY_NAV_ID[category]}
            style={{ borderTop: groupIdx > 0 ? '1px solid var(--border)' : 'none' }}
          >
            <div style={{ padding: '1rem 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: hasMissingRequired ? '#DC2626' : 'var(--muted)' }}>
                {category}
              </p>
              {hasMissingRequired && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <circle cx="6" cy="6" r="6" fill="#DC2626" />
                  <path d="M6 3.5V6" stroke="white" strokeWidth="1.25" strokeLinecap="round" />
                  <circle cx="6" cy="8.25" r="0.625" fill="white" />
                </svg>
              )}
            </div>
            <div style={{ padding: '0 1.25rem' }}>
              {items.map((item) => (
                <ChecklistItemRow
                  key={item.slug}
                  item={item}
                  uploads={uploadsBySlug[item.slug] ?? []}
                  commentsBySlug={commentsBySlug}
                  isActive={activeSlug === item.slug}
                  onToggle={() => handleToggle(item.slug)}
                />
              ))}
            </div>
          </div>
          )
        })}
      </div>
    </section>
  )
}
