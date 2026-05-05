import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { resolveToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/identity'

/**
 * Next.js 16+ convention: `proxy.ts` runs before routes (replaces deprecated `middleware.ts`).
 * Visiting `/?token=…` sets the `idn` cookie and redirects to strip the token from the URL.
 */
export function proxy(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (token) {
    const identity = resolveToken(token)
    if (identity) {
      const cleanUrl = request.nextUrl.clone()
      cleanUrl.searchParams.delete('token')

      const response = NextResponse.redirect(cleanUrl)
      response.cookies.set(COOKIE_NAME, identity.name, {
        maxAge: COOKIE_MAX_AGE,
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
      })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
