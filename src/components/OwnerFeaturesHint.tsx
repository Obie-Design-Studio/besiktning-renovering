'use client'

import { useIdentityContext } from '@/context/IdentityContext'

/**
 * When no identity cookie/session exists, Tobias-only features are hidden.
 * Explains why upload log + “Markera sektion klar” etc. don’t appear yet.
 */
export function OwnerFeaturesHint() {
  const { identity } = useIdentityContext()

  if (identity !== null) return null

  return (
    <div
      role="status"
      style={{
        marginBottom: '1.25rem',
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        border: '1px solid #FDE68A',
        background: '#FFFBEB',
        fontSize: '0.8125rem',
        lineHeight: 1.5,
        color: '#92400E',
      }}
    >
      <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Du är inte identifierad i den här webbläsaren</strong>
      Vissa funktioner visas bara för ägaren (Tobias): <strong>uppladdningslogg</strong> längst ned,
      knappen <strong>„Markera sektion klar”</strong> vid varje dokumentationsblock, och att{' '}
      <strong>ändra vem som står som uppladdare</strong>.
      <span style={{ display: 'block', marginTop: '0.5rem' }}>
        Öppna portalen <strong>en gång</strong> med din personliga länk som innehåller{' '}
        <code style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
          ?token=…
        </code>{' '}
        (samma värde som <code style={{ fontSize: '0.75rem' }}>IDENTITY_TOKEN_TOBIAS</code> i{' '}
        <code style={{ fontSize: '0.75rem' }}>.env.local</code>). Då sparas en cookie och funktionerna aktiveras.
      </span>
    </div>
  )
}
