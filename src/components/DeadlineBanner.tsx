'use client'

const DEADLINE = new Date('2026-04-30T23:59:59')

export function DeadlineBanner() {
  const now = new Date()
  const isPast = now > DEADLINE
  const isUrgent = !isPast && DEADLINE.getTime() - now.getTime() < 72 * 60 * 60 * 1000

  if (!isPast && !isUrgent) return null

  return (
    <div
      className="flex items-center gap-3 text-sm font-medium"
      style={{
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: `1px solid ${isPast ? '#FCA5A5' : '#FCD34D'}`,
        background: isPast ? '#FEF2F2' : '#FFFBEB',
        color: isPast ? '#B91C1C' : '#92400E',
      }}
      role="alert"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      {isPast
        ? 'Deadline för inlämning av handlingar har passerat (30 april 2026).'
        : 'Handlingar ska vara inlämnade senast 30 april 2026.'}
    </div>
  )
}
