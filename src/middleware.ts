import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only enforce staging gate if STAGING_ACCESS_PASSWORD is set
  const stagingPassword = process.env.STAGING_ACCESS_PASSWORD
  
  if (!stagingPassword) {
    // Not in staging mode, allow all requests
    return NextResponse.next()
  }

  // Check if user has staging access cookie
  const stagingAccess = request.cookies.get('staging-access')
  const pathname = request.nextUrl.pathname
  
  // Allow access to staging gate page and API routes needed for authentication
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
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (but we'll handle /api/staging-access and /api/auth specially)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
