import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // VERCEL_ENV is set by Vercel at runtime (preview | production | development) and is
  // available in Edge. Use it so preview deployments get the gate without NEXT_PUBLIC_.
  // Fallback to NEXT_PUBLIC_ for non-Vercel or if you need the gate on production.
  const stagingGateEnabled =
    process.env.VERCEL_ENV === 'preview' ||
    process.env.NEXT_PUBLIC_STAGING_GATE_ENABLED === 'true'

  if (!stagingGateEnabled) {
    const res = NextResponse.next()
    res.headers.set('X-Staging-Gate', 'disabled')
    return res
  }

  // Check if user has staging access cookie
  const stagingAccess = request.cookies.get('staging-access')
  const pathname = request.nextUrl.pathname
  
  // Allow staging gate, its API, and auth API (NextAuth needs JSON from /api/auth/*, not redirects)
  const allowedPaths = [
    '/staging-gate',
    '/api/staging-access',
    '/api/auth',
  ]
  
  const isAllowedPath = allowedPaths.some(path => 
    pathname === path || pathname.startsWith(path)
  )
  
  // Also allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    isAllowedPath
  ) {
    return NextResponse.next()
  }
  
  // If no staging access cookie, redirect to staging gate
  if (!stagingAccess || stagingAccess.value !== 'granted') {
    const url = request.nextUrl.clone()
    url.pathname = '/staging-gate'
    // Preserve the original destination
    if (pathname !== '/' && pathname !== '/staging-gate') {
      url.searchParams.set('redirect', pathname)
    }
    const redirect = NextResponse.redirect(url)
    redirect.headers.set('X-Staging-Gate', 'redirect')
    return redirect
  }

  const res = NextResponse.next()
  res.headers.set('X-Staging-Gate', 'passed')
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image, favicon.ico
     * (staging gate allows only /staging-gate and /api/staging-access without cookie)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
