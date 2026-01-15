import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone || phone.length < 9) {
        return NextResponse.json({ available: false, message: 'Nomor terlalu pendek' });
    }

    try {
        // Check if phone exists AND is not the current user's own phone
        const stmt = db.prepare('SELECT id FROM User WHERE phone = ? AND id != ?');
        const user = stmt.get(phone, session.userId);

        if (user) {
            return NextResponse.json({ available: false, message: 'Nomor HP sudah digunakan' });
        } else {
            return NextResponse.json({ available: true, message: 'Nomor HP tersedia' });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
