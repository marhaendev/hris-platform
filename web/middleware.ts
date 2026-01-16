import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const key = new TextEncoder().encode(process.env.JWT_SECRET || 'secret123');

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('session');
    const { pathname } = request.nextUrl;

    // Only run on login page
    const publicPaths = ['/login'];
    if (!publicPaths.includes(pathname)) {
        return NextResponse.next();
    }

    if (sessionCookie?.value) {
        try {
            // Verify JWT
            await jwtVerify(sessionCookie.value, key, {
                algorithms: ['HS256'],
            });

            // If valid session and on public path, redirect to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch (error) {
            // Session invalid/expired, allow access to public pages
            // Optional: Response could delete the invalid cookie, but let's keep it simple
            return NextResponse.next();
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - logo.png (public assets)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|icon.png).*)',
    ],
};
