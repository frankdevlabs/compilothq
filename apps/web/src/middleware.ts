import { auth } from '@/lib/auth/config'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/error',
    '/verify-request',
  ]

  // Check if current route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route) ||
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

  // If user is authenticated but doesn't have an organization
  // and is not on the create-organization page, redirect there
  if (isAuthenticated && !req.auth.user?.organizationId) {
    if (pathname !== '/create-organization') {
      const createOrgUrl = new URL('/create-organization', req.url)
      return Response.redirect(createOrgUrl)
    }
  }

  // Allow authenticated users with organizations to access protected routes
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
