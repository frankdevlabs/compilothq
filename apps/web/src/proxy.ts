import { auth } from '@/lib/auth/config'

/**
 * Next.js 16 Proxy (formerly middleware)
 * Handles authentication and route protection
 */
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // Routes that require user to NOT be authenticated (redirect to dashboard if logged in)
  const authRoutes = ['/login', '/signup']

  // Routes accessible to everyone regardless of auth status
  const publicRoutes = ['/', '/error', '/verify-request']

  // Check route types
  const isAuthRoute = authRoutes.some((route) => pathname === route)
  const isPublicRoute =
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/invite/')

  // If user is authenticated and trying to access auth pages, redirect away
  if (isAuthenticated && isAuthRoute) {
    const callbackUrl = req.nextUrl.searchParams.get('callbackUrl')
    // Validate callbackUrl: must be relative path starting with /
    const redirectTo = callbackUrl?.startsWith('/') ? callbackUrl : '/dashboard'
    return Response.redirect(new URL(redirectTo, req.url))
  }

  // If route is public or auth route (for unauthenticated users), allow access
  if (isPublicRoute || isAuthRoute) {
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
