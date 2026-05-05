'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setSectionCompletion } from '@/actions/section-completion'

/** Manual “section complete” shortcut — requires identity cookie (use ?token= or token paste in yellow banner). */
export function SectionCompleteToggle({
  navId,
  completed,
}: {
  navId: string
  completed: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setPending(true)
    setError(null)
    const result = await setSectionCompletion(navId, !completed)
    setPending(false)
    if (result.success) router.refresh()
    else setError(result.error ?? 'Kunde inte spara.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
    <button
      type="button"
      disabled={pending}
      onClick={toggle}
      style={{
        fontSize: '0.6875rem',
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: '6px',
        border: `1px solid ${completed ? '#86EFAC' : 'var(--border)'}`,
        background: completed ? '#F0FDF4' : 'var(--card)',
        color: completed ? '#15803D' : 'var(--muted)',
        cursor: pending ? 'wait' : 'pointer',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {completed ? '✓ Sektion klar' : 'Markera sektion klar'}
    </button>
    {error && (
      <span style={{ fontSize: '0.625rem', color: '#DC2626', maxWidth: '14rem', textAlign: 'right', lineHeight: 1.35 }}>
        {error}
      </span>
    )}
    </div>
  )
}
