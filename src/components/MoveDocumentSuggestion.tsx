'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIdentityContext } from '@/context/IdentityContext'
import { moveDocumentToSlug } from '@/actions/move-document-to-slug'
import { CHECKLIST_ITEMS } from '@/data/checklist-items'

function slugToLabel(slug: string): string {
  const item = CHECKLIST_ITEMS.find((i) => i.slug === slug)
  return item ? `${item.category} — ${item.title}` : slug
}

/**
 * Tobias-only: shows an AI-suggested re-filing hint below a document.
 * One click moves the document to the correct section.
 *
 * Rendered only when `upload.suggested_slug` differs from `upload.document_item_slug`.
 */
export function MoveDocumentSuggestion({
  documentId,
  currentSlug,
  suggestedSlug,
}: {
  documentId: string
  currentSlug: string
  suggestedSlug: string
}) {
  const { identity } = useIdentityContext()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  if (identity !== 'Tobias') return null
  if (dismissed || suggestedSlug === currentSlug) return null

  async function confirmMove() {
    setPending(true)
    setError(null)
    const result = await moveDocumentToSlug(documentId, suggestedSlug)
    setPending(false)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error ?? 'Kunde inte flytta dokumentet.')
    }
  }

  return (
    <div
      style={{
        marginTop: '0.5rem',
        padding: '0.5rem 0.75rem',
        borderRadius: '6px',
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        flexWrap: 'wrap',
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" width="13" height="13" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35M11 8v3M11 14h.01" />
      </svg>
      <span style={{ fontSize: '0.75rem', color: '#1D4ED8', flex: 1 }}>
        AI föreslår att flytta detta dokument till <strong>{slugToLabel(suggestedSlug)}</strong>
      </span>
      <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
        <button
          type="button"
          onClick={confirmMove}
          disabled={pending}
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: '5px',
            border: 'none',
            background: '#2563EB',
            color: '#fff',
            cursor: pending ? 'wait' : 'pointer',
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? 'Flyttar…' : 'Flytta →'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          disabled={pending}
          style={{
            fontSize: '0.6875rem',
            padding: '3px 8px',
            borderRadius: '5px',
            border: '1px solid #BFDBFE',
            background: 'none',
            color: '#6B7280',
            cursor: 'pointer',
          }}
        >
          Ignorera
        </button>
      </div>
      {error && (
        <span style={{ fontSize: '0.625rem', color: '#DC2626', width: '100%', lineHeight: 1.4 }}>
          {error}
        </span>
      )}
    </div>
  )
}
