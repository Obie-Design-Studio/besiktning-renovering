'use client'

import { useIdentity } from '@/hooks/useIdentity'

const DISPLAY: Record<string, string> = {
  Tobias: 'Tobias Johansson',
  'Palmens byggservice': 'Adde / Palmens Byggservice',
  Besiktningsman: 'Tomas Persson / Besiktningsman',
}

export function IdentityBadge() {
  const identity = useIdentity()
  if (!identity) return null

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '0.75rem',
        color: 'var(--muted)',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#16A34A',
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      {DISPLAY[identity] ?? identity}
    </span>
  )
}
