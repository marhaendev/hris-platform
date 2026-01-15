import { NextResponse } from 'next/server';
import { logout, getSession } from '@/lib/session';
import db from '@/lib/db';

export async function POST() {
    try {
        const session = await getSession();
        if (session && session.userId) {
            // Log Activity
            try {
                db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                    .run(session.userId, 'LOGOUT', 'Pengguna telah keluar', session.companyId);
            } catch (e) { }
        }
    } catch (e) { }

    await logout();
    return NextResponse.json({ success: true });
}
