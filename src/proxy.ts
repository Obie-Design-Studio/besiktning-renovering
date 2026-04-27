import { NextRequest, NextResponse } from 'next/server'
import { resolveToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/identity'

export function proxy(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (token) {
    const identity = resolveToken(token)
    if (identity) {
      // Strip the token from the URL so it's not visible in the browser bar
      const cleanUrl = request.nextUrl.clone()
      cleanUrl.searchParams.delete('token')

      const response = NextResponse.redirect(cleanUrl)
      response.cookies.set(COOKIE_NAME, identity.name, {
        maxAge: COOKIE_MAX_AGE,
        path: '/',
        sameSite: 'lax',
        httpOnly: false, // readable by client JS
        secure: process.env.NODE_ENV === 'production',
      })
      return response
    }
    // Unknown token — continue normally, don't set a cookie
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
