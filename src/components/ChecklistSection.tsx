'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CHECKLIST_ITEMS, groupItemsByCategory, CATEGORY_NAV_ID, CATEGORY_DESCRIPTIONS, type ChecklistItem } from '@/data/checklist-items'
import { CommentThread } from '@/components/CommentThread'
import { DeleteButton } from '@/components/DeleteButton'
import { updateDocument } from '@/actions/update-document'
import { useIdentityContext } from '@/context/IdentityContext'
import { useSmartUpload } from '@/context/SmartUploadContext'
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
}

function ChecklistItemRow({ item, uploads, commentsBySlug }: ChecklistItemRowProps) {
  const { processFiles } = useSmartUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
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
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 text-xs font-medium transition-colors"
          style={{
            color: 'var(--accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 0',
            textDecoration: 'underline',
          }}
        >
          {hasUploads ? '+ Lägg till' : '+ Ladda upp'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length) processFiles(files, item.slug)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

export function ChecklistSection({ uploadsBySlug, commentsBySlug }: ChecklistSectionProps) {
  const requiredItems = CHECKLIST_ITEMS.filter((item) => item.required)
  const missingRequired = requiredItems.filter(
    (item) => (uploadsBySlug[item.slug]?.length ?? 0) === 0,
  )
  const allRequiredDone = missingRequired.length === 0

  const groupedItems = groupItemsByCategory(CHECKLIST_ITEMS)

  return (
    <section style={{ marginBottom: '3rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 className="font-semibold" style={{ fontSize: '1.1rem', color: 'var(--foreground)', marginBottom: '0.75rem' }}>
          Dokumentation
        </h2>

        {/* Mandatory documents summary */}
        {allRequiredDone ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1rem', borderRadius: '8px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#15803D' }}>
              Alla obligatoriska dokument är inlämnade
            </p>
          </div>
        ) : (
          <div style={{ padding: '0.875rem 1rem', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#B91C1C' }}>
                {missingRequired.length === 1
                  ? '1 obligatoriskt dokument saknas'
                  : `${missingRequired.length} obligatoriska dokument saknas`}
              </p>
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {missingRequired.map((item) => (
                <li key={item.slug} style={{ fontSize: '0.8125rem', color: '#DC2626' }}>
                  {item.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {groupedItems.map(([category, items]) => {
          const hasMissingRequired = items.some(
            (item) => item.required && (uploadsBySlug[item.slug]?.length ?? 0) === 0
          )
          return (
          <div key={category} id={CATEGORY_NAV_ID[category]}>
            {/* Category heading — outside the card, matching ExtraDocsSection pattern */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
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

            {/* Individual card per category */}
            <div
              style={{
                background: 'var(--card)',
                border: `1px solid ${hasMissingRequired ? '#FCA5A5' : 'var(--border)'}`,
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              {/* Category description */}
              {CATEGORY_DESCRIPTIONS[category] && (
                <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.55 }}>
                    {CATEGORY_DESCRIPTIONS[category]}
                  </p>
                </div>
              )}

              {/* Document rows */}
              <div style={{ padding: '0 1.25rem' }}>
              {items.map((item) => (
                <ChecklistItemRow
                  key={item.slug}
                  item={item}
                  uploads={uploadsBySlug[item.slug] ?? []}
                  commentsBySlug={commentsBySlug}
                />
              ))}
              </div>
            </div>
          </div>
          )
        })}
      </div>
    </section>
  )
}
