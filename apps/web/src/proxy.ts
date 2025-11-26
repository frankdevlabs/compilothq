import { auth } from '@/lib/auth/middleware'

/**
 * Next.js 16 Proxy (formerly middleware)
 * Handles authentication and route protection
 */
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/error', '/verify-request']

  // Check if current route is public
  const isPublicRoute =
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/invite/')

  // If route is public, allow access
  if (isPublicRoute) {
    return
  }

  // If user is not authenticated and route is protected, redirect to login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(loginUrl)
  }

  // Allow all API routes for authenticated users
  // Authorization is handled by tRPC procedures (protectedProcedure, orgProcedure)
  if (pathname.startsWith('/api/')) {
    return
  }

  // Allow all authenticated users to access protected routes
  // Organization membership is checked at the page/component level
  // Note: Edge-compatible auth doesn't have access to organizationId from session callback
  return
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
