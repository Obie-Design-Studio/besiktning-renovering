'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { IdentityName } from '@/lib/identity'

const COOKIE_NAME = 'idn'
const SESSION_KEY = 'idn_session'
const VALID_NAMES: IdentityName[] = ['Tobias', 'Palmens byggservice', 'Besiktningsman']

function readCookie(name: string): IdentityName | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  const val = match ? decodeURIComponent(match[1]) : null
  return val && VALID_NAMES.includes(val as IdentityName) ? (val as IdentityName) : null
}

function readSession(): IdentityName | null {
  try {
    const val = sessionStorage.getItem(SESSION_KEY)
    return val && VALID_NAMES.includes(val as IdentityName) ? (val as IdentityName) : null
  } catch {
    return null
  }
}

interface IdentityContextValue {
  identity: IdentityName | null
  /** Called when a user manually picks their identity in a form (no token URL). Persists for the session. */
  setFallbackIdentity: (name: IdentityName) => void
}

const IdentityContext = createContext<IdentityContextValue>({
  identity: null,
  setFallbackIdentity: () => {},
})

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [cookieIdentity, setCookieIdentity] = useState<IdentityName | null>(null)
  const [sessionIdentity, setSessionIdentity] = useState<IdentityName | null>(null)

  /* eslint-disable react-hooks/set-state-in-effect -- one-time hydrate from cookie / sessionStorage after client mount */
  useEffect(() => {
    setCookieIdentity(readCookie(COOKIE_NAME))
    setSessionIdentity(readSession())
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  function setFallbackIdentity(name: IdentityName) {
    setSessionIdentity(name)
    try {
      sessionStorage.setItem(SESSION_KEY, name)
    } catch {
      // sessionStorage unavailable (e.g. private browsing restrictions) — in-memory only
    }
  }

  const identity = cookieIdentity ?? sessionIdentity

  return (
    <IdentityContext.Provider value={{ identity, setFallbackIdentity }}>
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentityContext(): IdentityContextValue {
  return useContext(IdentityContext)
}
