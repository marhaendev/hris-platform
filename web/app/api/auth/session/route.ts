import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        return NextResponse.json({
            authenticated: true,
            expires: session.expires,
            userId: session.userId,
            role: session.role,
            companyId: session.companyId
        });
    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
