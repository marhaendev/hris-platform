import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session || session.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { sessionId, companyIds } = body; // Array of IDs

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        if (!Array.isArray(companyIds)) {
            return NextResponse.json({ error: 'companyIds must be an array' }, { status: 400 });
        }

        // 1. Clear this bot from all companies first (to ensure clean re-assignment if needed)
        // Or better: just update the specific companies provided.
        // But usually, the UI will send the FULL list of who should have this bot.

        // Let's do it atomically:
        const update = db.transaction((ids: number[], sid: string) => {
            // Option A: Set other companies that WERE using this bot to NULL?
            // "penggunaan bisa diatur ke banyak perusahaan dong jadi saya bisa pilih"
            // This implies: "For this bot, I choose companies A, B, C."

            // First, find all companies currently using this bot and unset them
            db.prepare('UPDATE Company SET whatsapp_session_id = NULL WHERE whatsapp_session_id = ?').run(sid);

            // Then, set the new list
            const stmt = db.prepare('UPDATE Company SET whatsapp_session_id = ? WHERE id = ?');
            for (const id of ids) {
                stmt.run(sid, id);
            }
        });

        update(companyIds, sessionId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
