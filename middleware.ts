import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes
  if (pathname === '/login') {
    if (isLoggedIn) {
      const role = req.auth?.user?.role
      return NextResponse.redirect(
        new URL(role === 'SUPERVISOR' ? '/reportes' : '/venta', req.url)
      )
    }
    return NextResponse.next()
  }

  // Root redirect
  if (pathname === '/') {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/login', req.url))
    const role = req.auth?.user?.role
    return NextResponse.redirect(
      new URL(role === 'SUPERVISOR' ? '/reportes' : '/venta', req.url)
    )
  }

  // Protected routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = req.auth?.user?.role

  // Admin + Reportes — SUPERVISOR only
  if ((pathname.startsWith('/admin') || pathname.startsWith('/reportes')) && role !== 'SUPERVISOR') {
    return NextResponse.redirect(new URL('/venta', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox).*)'],
}
