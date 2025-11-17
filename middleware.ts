import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Allow public GET requests to fetch individual ad details (for upload schemas)
  if (req.url.includes('/api/admin/ads/') && req.method === 'GET') {
    // Check if it's a specific ad ID endpoint (not the list endpoint)
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    // Path format: /api/admin/ads/{id} - should have exactly 5 parts
    if (pathParts.length === 5 && pathParts[4]) {
      return // Allow public access
    }
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
