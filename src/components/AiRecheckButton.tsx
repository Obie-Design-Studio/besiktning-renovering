'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIdentityContext } from '@/context/IdentityContext'

/**
 * Tobias-only button that triggers a full AI re-check of all uploaded documents
 * against the mandatory checklist. Results are persisted to `ai_coverage_cache`
 * so they survive page loads (no Gemini call on every SSR after this).
 *
 * Show this whenever a mandatory document is flagged as missing — it gives
 * Tobias a way to ask the AI to look again with fresh eyes.
 */
export function AiRecheckButton() {
  const { identity } = useIdentityContext()
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (identity !== 'Tobias') return null

  async function runRecheck() {
    setState('loading')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/recheck-section', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setErrorMsg((body as { error?: string }).error ?? `HTTP ${res.status}`)
        setState('error')
        return
      }
      setState('done')
      router.refresh()
    } catch {
      setErrorMsg('Nätverksfel — försök igen.')
      setState('error')
    }
  }

  const isLoading = state === 'loading'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
      <button
        type="button"
        onClick={runRecheck}
        disabled={isLoading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.6875rem',
          fontWeight: 600,
          padding: '5px 12px',
          borderRadius: '6px',
          border: '1px solid #BFDBFE',
          background: isLoading ? '#EFF6FF' : '#DBEAFE',
          color: '#1D4ED8',
          cursor: isLoading ? 'wait' : 'pointer',
          whiteSpace: 'nowrap',
          transition: 'background 0.15s',
        }}
      >
        {isLoading ? (
          <>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', width: 12, height: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
            </span>
            AI granskar…
          </>
        ) : state === 'done' ? (
          '✓ Granskning klar'
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35M11 8v3M11 14h.01" />
            </svg>
            AI-granska dokument
          </>
        )}
      </button>
      {state === 'error' && errorMsg && (
        <span style={{ fontSize: '0.625rem', color: '#DC2626', maxWidth: '16rem', lineHeight: 1.4 }}>
          {errorMsg}
        </span>
      )}
      {state === 'done' && (
        <span style={{ fontSize: '0.625rem', color: '#15803D', lineHeight: 1.4 }}>
          Resultaten är sparade — sidan är uppdaterad.
        </span>
      )}
    </div>
  )
}
