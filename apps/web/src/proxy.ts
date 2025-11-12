/**
 * Next.js 16 Proxy (renamed from middleware.ts)
 *
 * This file handles request interception for authentication and routing.
 *
 * Current state: Basic structure only
 * Future (Item #16): Add NextAuth.js session checking and route protection
 * Note: Function will become async when authentication is implemented
 *
 * IMPORTANT: In Next.js 16, this file is named proxy.ts (not middleware.ts)
 * and exports a function named `proxy` (not `middleware`).
 */

import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Future: Add authentication check here
  // const session = await getSession(request)

  // Protected routes (will require authentication in Item #16)
  const protectedPaths = [
    '/dashboard',
    '/activities',
    '/components',
    '/questionnaires',
    '/documents',
    '/settings',
  ]
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  if (isProtectedPath) {
    // Future: Redirect to login if not authenticated
    // if (!session) {
    //   return NextResponse.redirect(new URL('/login', request.url))
    // }
  }

  // Public routes - allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
