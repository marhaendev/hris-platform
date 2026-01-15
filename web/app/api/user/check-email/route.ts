import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    // Basic email regex validaton
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
        return NextResponse.json({ available: false, message: 'Format email tidak valid' });
    }

    try {
        // Check if email exists AND is not the current user's
        const stmt = db.prepare('SELECT id FROM User WHERE email = ? AND id != ?');
        const user = stmt.get(email, session.userId);

        if (user) {
            return NextResponse.json({ available: false, message: 'Email sudah digunakan' });
        } else {
            return NextResponse.json({ available: true, message: 'Email tersedia' });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
