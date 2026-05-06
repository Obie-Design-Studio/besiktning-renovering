'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHECKLIST_ITEMS, groupItemsByCategory, CATEGORY_NAV_ID, CATEGORY_DESCRIPTIONS, type ChecklistItem } from '@/data/checklist-items'
import { CommentThread } from '@/components/CommentThread'
import { DeleteButton } from '@/components/DeleteButton'
import { DocumentUploaderMeta } from '@/components/DocumentUploaderMeta'
import { SectionCompleteToggle } from '@/components/SectionCompleteToggle'
import { AiRecheckButton } from '@/components/AiRecheckButton'
import { MoveDocumentSuggestion } from '@/components/MoveDocumentSuggestion'
import { updateDocument } from '@/actions/update-document'
import { useIdentityContext } from '@/context/IdentityContext'
import { useSmartUpload } from '@/context/SmartUploadContext'
import type { DocumentUpload } from '@/types/document'
import type { Comment } from '@/types/comment'

interface ChecklistSectionProps {
  uploadsBySlug: Record<string, DocumentUpload[]>
  commentsBySlug: Record<string, Comment[]>
  /** Obligatoriska slugs utan egen fil men AI bedömer krav täckta i samma område */
  aiSatisfiedRequiredSlugs?: string[]
  /** Tobias-manuellt markerade klara sektioner */
  completedSectionNavIds?: string[]
}

function UploadedFile({
  upload,
  comments,
  sectionCompleted = false,
}: {
  upload: DocumentUpload
  comments: Comment[]
  sectionCompleted?: boolean
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
      {!sectionCompleted && upload.suggested_slug && upload.suggested_slug !== upload.document_item_slug && (
        <MoveDocumentSuggestion
          documentId={upload.id}
          currentSlug={upload.document_item_slug}
          suggestedSlug={upload.suggested_slug}
        />
      )}
      <CommentThread slug={`file:${upload.id}`} comments={comments} />
    </div>
  )
}


/** Opens the full upload panel (file + URL) pre-pointed at a category slug. */
function AddDocButton({ slug }: { slug: string }) {
  const { openPanel } = useSmartUpload()
  return (
    <button
      type="button"
      onClick={() => openPanel(slug)}
      style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}
    >
      + Lägg till
    </button>
  )
}

export function ChecklistSection({
  uploadsBySlug,
  commentsBySlug,
  aiSatisfiedRequiredSlugs = [],
  completedSectionNavIds = [],
}: ChecklistSectionProps) {
  const requiredItems = CHECKLIST_ITEMS.filter((item) => item.required)
  const aiOk = new Set(aiSatisfiedRequiredSlugs)
  const completedNav = new Set(completedSectionNavIds)

  function mandatoryMissing(item: ChecklistItem): boolean {
    if (!item.required) return false
    const navId = CATEGORY_NAV_ID[item.category]
    if (navId && completedNav.has(navId)) return false
    if ((uploadsBySlug[item.slug]?.length ?? 0) > 0) return false
    return !aiOk.has(item.slug)
  }

  const missingRequired = requiredItems.filter(mandatoryMissing)
  const allRequiredDone = missingRequired.length === 0

  const groupedItems = groupItemsByCategory(CHECKLIST_ITEMS)

  return (
    <section style={{ marginBottom: '3rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 className="font-semibold" style={{ fontSize: '1.1rem', color: 'var(--foreground)', marginBottom: '0.75rem' }}>
          Dokumentation
        </h2>

        {/* Top-level mandatory summary banner */}
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
                {missingRequired.length === 1 ? '1 obligatoriskt dokument saknas' : `${missingRequired.length} obligatoriska dokument saknas`}
              </p>
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {missingRequired.map((item) => (
                <li key={item.slug} style={{ fontSize: '0.8125rem', color: '#DC2626' }}>{item.title}</li>
              ))}
            </ul>
          </div>
        )}
        {aiSatisfiedRequiredSlugs.length > 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.65rem', lineHeight: 1.45 }}>
            Minst ett obligatoriskt krav är bedömt som täckt utifrån befintliga dokument i samma område (AI jämför titel och beskrivning med kravlistan när arkiveringen hamnat fel).
          </p>
        )}
        {!allRequiredDone && (
          <div style={{ marginTop: '0.75rem' }}>
            <AiRecheckButton />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {groupedItems.map(([category, items]) => {
          // All uploads for this category, flattened and in upload order
          const categoryUploads = items.flatMap((item) => uploadsBySlug[item.slug] ?? [])
          // Required items in this category that still have no uploads
          const categoryMissingRequired = items.filter(mandatoryMissing)
          // Default slug for the general "add" button — first item in the category
          const defaultSlug = items[0]?.slug ?? 'ovrig'

          const navId = CATEGORY_NAV_ID[category]
          const sectionDone = navId ? completedNav.has(navId) : false

          return (
            <div key={category} id={navId}>

              {/* ── Section header (outside the card) ── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="font-semibold" style={{ fontSize: '1.1rem', color: 'var(--foreground)', marginBottom: '0.15rem' }}>
                    {category}
                  </h3>
                  {CATEGORY_DESCRIPTIONS[category] && (
                    <p className="text-sm" style={{ color: 'var(--muted)', marginTop: '0.15rem' }}>
                      {CATEGORY_DESCRIPTIONS[category]}
                    </p>
                  )}
                  {/* Required items missing in this category */}
                  {categoryMissingRequired.length > 0 && (
                    <p style={{ fontSize: '0.8125rem', color: '#DC2626', marginTop: '0.4rem' }}>
                      <span style={{ fontWeight: 600 }}>Saknas: </span>
                      {categoryMissingRequired.map((item) => item.title).join(', ')}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexShrink: 0 }}>
                  {navId && (
                    <SectionCompleteToggle navId={navId} completed={sectionDone} />
                  )}
                  <AddDocButton slug={defaultSlug} />
                </div>
              </div>

              {/* ── White card — uploaded files only ── */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                {categoryUploads.length > 0 ? (
                  <div style={{ padding: '0 1.25rem 1.25rem' }}>
                    {categoryUploads.map((upload, idx) => (
                      <div key={upload.id} style={idx < categoryUploads.length - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}>
                        <UploadedFile
                          upload={upload}
                          comments={commentsBySlug[`file:${upload.id}`] ?? []}
                          sectionCompleted={sectionDone}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ padding: '1.5rem 1.25rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    Inga dokument uppladdade ännu.
                  </p>
                )}
              </div>

            </div>
          )
        })}
      </div>
    </section>
  )
}
