'use client'

import { useState } from 'react'
import { CHECKLIST_ITEMS, groupItemsByCategory, CATEGORY_NAV_ID, type ChecklistItem } from '@/data/checklist-items'
import { InlineUploadForm } from '@/components/InlineUploadForm'
import { CommentThread } from '@/components/CommentThread'
import { DeleteButton } from '@/components/DeleteButton'
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
  return (
    <div style={{ paddingTop: '0.875rem' }}>
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
          <a
            href={upload.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium"
            style={{ color: 'var(--accent)', textDecoration: 'underline' }}
          >
            Läs dokument →
          </a>
          <DeleteButton documentId={upload.id} documentTitle={upload.upload_title} />
        </div>
      </div>
      <CommentThread
        slug={`file:${upload.id}`}
        comments={comments}
      />
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
        {groupedItems.map(([category, items], groupIdx) => (
          <div
            key={category}
            id={CATEGORY_NAV_ID[category]}
            style={{ borderTop: groupIdx > 0 ? '1px solid var(--border)' : 'none' }}
          >
            <div style={{ padding: '1rem 1.25rem 0' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                {category}
              </p>
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
        ))}
      </div>
    </section>
  )
}
