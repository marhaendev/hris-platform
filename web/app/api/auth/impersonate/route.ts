import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createSession, getSession } from '@/lib/session';

export async function POST(request: Request) {
    try {
        const session = await getSession();

        // 1. Validasi: Hanya Superadmin (atau yang sedang simulasi) yang bisa mengintip
        if (!session || (session.role !== 'SUPERADMIN' && !session.impersonatorId)) {
            return NextResponse.json({ error: 'Hanya Superadmin yang dizinkan menggunakan fitur ini' }, { status: 403 });
        }

        const body = await request.json();
        const { targetUserId } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: 'Target User ID wajib diisi' }, { status: 400 });
        }

        // 2. Cari data target user
        const targetUser = db.prepare('SELECT * FROM User WHERE id = ?').get(targetUserId) as any;

        if (!targetUser) {
            return NextResponse.json({ error: 'User target tidak ditemukan' }, { status: 404 });
        }

        // Tentukan siapa penyamar aslinya (jika sedang simulasi, gunakan data dari sesi simulasi)
        const originalId = session.impersonatorId || session.userId.toString();
        const originalName = session.impersonatorName || session.name;

        console.log(`[Impersonation] Original Superadmin ${originalName} switching/starting login as ${targetUser.name}`);

        // 4. Buat sesi baru dengan data target user, tapi tetap bawa data penyamar asli
        await createSession(
            targetUser.id.toString(),
            targetUser.companyId,
            targetUser.role,
            targetUser.name,
            targetUser.email,
            targetUser.phone,
            originalId,
            originalName
        );

        // 5. Log activity (Pencatatan dilakukan atas nama Admin asli)
        try {
            db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                .run(originalId, 'IMPERSONATE', `Switch/Start simulasi sebagai ${targetUser.name} (${targetUser.role})`, targetUser.companyId);
        } catch (e) { }

        return NextResponse.json({ success: true, targetRole: targetUser.role });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
