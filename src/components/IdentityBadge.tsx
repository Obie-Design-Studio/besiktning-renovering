'use client'

import { useIdentityContext } from '@/context/IdentityContext'

const DISPLAY: Record<string, string> = {
  Tobias: 'Tobias Johansson',
  'Palmens byggservice': 'Adde / Palmens Byggservice',
  Besiktningsman: 'Tomas Persson / Besiktningsman',
}

export function IdentityBadge() {
  const { identity } = useIdentityContext()
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
