import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createSession, getSession } from '@/lib/session';

export async function POST(request: Request) {
    try {
        const session = await getSession();

        // 1. Cek apakah sedang dalam mode penyamaran
        if (!session || !session.impersonatorId) {
            return NextResponse.json({ error: 'Anda tidak sedang dalam mode penyamaran' }, { status: 400 });
        }

        const originalId = session.impersonatorId;
        console.log(`[Impersonation] Returning to original account: ID ${originalId}`);

        // 2. Ambil data asli Superadmin
        const originalUser = db.prepare('SELECT * FROM User WHERE id = ?').get(originalId) as any;

        if (!originalUser) {
            return NextResponse.json({ error: 'Data akun asli tidak ditemukan' }, { status: 404 });
        }

        // 3. Kembalikan sesi ke Superadmin asli (tanpa data impersonator lagi)
        await createSession(
            originalUser.id.toString(),
            originalUser.companyId,
            originalUser.role,
            originalUser.name,
            originalUser.email,
            originalUser.phone
        );

        // 4. Log activity
        try {
            db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                .run(originalUser.id, 'IMPERSONATE_STOP', `Superadmin berhenti mengintip dan kembali ke akun asli`, originalUser.companyId);
        } catch (e) { }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
