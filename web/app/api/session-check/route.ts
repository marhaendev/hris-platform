import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        // Return basic session info and expiration if needed
        return NextResponse.json({
            authenticated: true,
            expires: session.expires,
            userId: session.userId
        });
    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
