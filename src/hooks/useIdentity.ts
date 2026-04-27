'use client'

import { useMemo } from 'react'
import type { IdentityName } from '@/lib/identity'

const COOKIE_NAME = 'idn'

const VALID_NAMES: IdentityName[] = ['Tobias', 'Palmens byggservice', 'Besiktningsman']

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function useIdentity(): IdentityName | null {
  return useMemo(() => {
    const value = readCookie(COOKIE_NAME)
    if (!value) return null
    return VALID_NAMES.includes(value as IdentityName) ? (value as IdentityName) : null
  }, [])
}
