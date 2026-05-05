'use server'

import { cookies } from 'next/headers'
import { resolveToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/identity'

/**
 * Sets the `idn` cookie from a valid identity token (same as visiting `/?token=…`).
 * Lets Tobias unlock owner-only UI (section toggle, upload log, etc.) without bookmarking the query URL.
 */
export async function establishIdentityCookie(
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = token.trim()
  if (!trimmed) return { ok: false, error: 'Klistra in tokenvärdet.' }

  const identity = resolveToken(trimmed)
  if (!identity) return { ok: false, error: 'Ogiltig eller okänd token.' }

  const store = await cookies()
  store.set(COOKIE_NAME, identity.name, {
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  })

  return { ok: true }
}
