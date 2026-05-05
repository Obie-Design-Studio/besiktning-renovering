import { cookies } from 'next/headers'
import { COOKIE_NAME, type IdentityName } from '@/lib/identity'

const VALID: IdentityName[] = ['Tobias', 'Palmens byggservice', 'Besiktningsman']

/** Identity from the `idn` cookie (same as client IdentityProvider cookie branch). */
export async function getCookieIdentity(): Promise<IdentityName | null> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value
  return raw && VALID.includes(raw as IdentityName) ? (raw as IdentityName) : null
}

export async function isTobiasSession(): Promise<boolean> {
  return (await getCookieIdentity()) === 'Tobias'
}
