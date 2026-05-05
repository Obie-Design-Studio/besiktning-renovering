'use client'

import { useState } from 'react'
import { useIdentityContext } from '@/context/IdentityContext'
import { establishIdentityCookie } from '@/actions/establish-identity-cookie'

function TokenPasteForm() {
  const [token, setToken] = useState('')
  const [pending, setPending] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setMsg(null)
    const result = await establishIdentityCookie(token)
    setPending(false)
    if (result.ok) {
      setToken('')
      window.location.reload()
      return
    }
    setMsg(result.error ?? 'Kunde inte spara cookie.')
  }

  return (
    <form
      onSubmit={submit}
      style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
    >
      <label htmlFor="identity-token-paste" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
        Har du token-värdet? Klistra in här (samma som efter <code style={{ fontSize: '0.7rem' }}>?token=</code> i URL:en):
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          id="identity-token-paste"
          type="password"
          autoComplete="off"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Token från Vercel / miljövariabler"
          style={{
            flex: '1 1 220px',
            fontSize: '0.8125rem',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #FCD34D',
            fontFamily: 'ui-monospace, monospace',
          }}
        />
        <button
          type="submit"
          disabled={pending || !token.trim()}
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #D97706',
            background: pending ? '#FEF3C7' : '#FBBF24',
            color: '#78350F',
            cursor: pending || !token.trim() ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          {pending ? 'Sparar…' : 'Spara cookie'}
        </button>
      </div>
      {msg && <p style={{ margin: 0, fontSize: '0.75rem', color: '#B91C1C' }}>{msg}</p>}
    </form>
  )
}

/**
 * Shown only when no identity cookie/session — explains token login and sets `idn` cookie so server
 * actions (section completion, etc.) work.
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
      <strong style={{ display: 'block', marginBottom: '0.35rem' }}>
        Du är inte identifierad i den här webbläsaren
      </strong>
      Utan cookie kan servern inte spara t.ex. <strong>„Markera sektion klar”</strong>. Öppna sidan en gång med{' '}
      <code style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
        ?token=…
      </code>{' '}
      (token från Vercel / <code style={{ fontSize: '0.75rem' }}>IDENTITY_TOKEN_*</code>), eller klistra in token nedan.
      <span style={{ display: 'block', marginTop: '0.45rem', fontSize: '0.75rem', opacity: 0.95 }}>
        Uppladdningslogg och ändra uppladdare visas bara för Tobias efter inloggning med Tobias-token.
      </span>
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem' }}>
        <a
          href="/api/identity-health"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#B45309', textDecoration: 'underline', fontWeight: 600 }}
        >
          Kontrollera miljövariabler (JSON)
        </a>
        {' — '}visar om Vercel har satt token och övriga nycklar (inga hemligheter i svaret).
      </p>
      <TokenPasteForm />
    </div>
  )
}
