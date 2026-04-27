'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteDocument } from '@/actions/delete-document'
import { useIdentityContext } from '@/context/IdentityContext'

interface DeleteButtonProps {
  documentId: string
  documentTitle: string
}

export function DeleteButton({ documentId, documentTitle }: DeleteButtonProps) {
  const { identity } = useIdentityContext()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (identity !== 'Tobias') return null

  function handleDelete() {
    const confirmed = window.confirm(
      `Ta bort "${documentTitle}"?\n\nDetta kan inte ångras.`,
    )
    if (!confirmed) return

    setError(null)
    startTransition(async () => {
      const result = await deleteDocument(documentId)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Något gick fel.')
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        aria-label={`Ta bort ${documentTitle}`}
        title="Ta bort"
        style={{
          background: 'none',
          border: 'none',
          cursor: isPending ? 'not-allowed' : 'pointer',
          padding: '2px 4px',
          color: '#DC2626',
          opacity: isPending ? 0.4 : 0.5,
          fontSize: '0.75rem',
          lineHeight: 1,
          transition: 'opacity 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={e => { if (!isPending) e.currentTarget.style.opacity = '1' }}
        onMouseLeave={e => { if (!isPending) e.currentTarget.style.opacity = '0.5' }}
      >
        {isPending ? '…' : '✕'}
      </button>
      {error && (
        <p style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.25rem' }}>{error}</p>
      )}
    </div>
  )
}
