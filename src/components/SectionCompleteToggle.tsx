'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIdentityContext } from '@/context/IdentityContext'
import { setSectionCompletion } from '@/actions/section-completion'

/** Tobias-only: manual “section complete” shortcut for besiktning workflow. */
export function SectionCompleteToggle({
  navId,
  completed,
}: {
  navId: string
  completed: boolean
}) {
  const { identity } = useIdentityContext()
  const router = useRouter()
  const [pending, setPending] = useState(false)

  if (identity !== 'Tobias') return null

  async function toggle() {
    setPending(true)
    const result = await setSectionCompletion(navId, !completed)
    setPending(false)
    if (result.success) router.refresh()
  }

  return (
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
  )
}
