import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy to protect admin routes
 * Checks for auth cookies and redirects to login if not authenticated
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /admin/dashboard routes
    if (pathname.startsWith('/admin/dashboard')) {
        const accessToken = request.cookies.get('sb-access-token')?.value;
        const refreshToken = request.cookies.get('sb-refresh-token')?.value;

        // No auth cookies - redirect to login
        if (!accessToken || !refreshToken) {
            const loginUrl = new URL('/admin', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Allow login page and API routes
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
