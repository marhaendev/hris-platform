import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createSession } from '@/lib/session';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, code } = body;

        if (!phone || !code) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
        }

        // 1. Verify OTP
        const now = new Date().toISOString();
        const otpRecord = db.prepare(`
            SELECT * FROM OTP 
            WHERE identifier = ? AND code = ? AND expiresAt > ?
            ORDER BY createdAt DESC LIMIT 1
        `).get(phone, code, now) as any;

        if (!otpRecord) {
            return NextResponse.json({ error: 'Kode OTP salah atau sudah kadaluarsa' }, { status: 400 });
        }

        // 2. Find User
        const user = db.prepare('SELECT * FROM User WHERE phone = ?').get(phone) as any;
        if (!user) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
        }

        // 3. Login (Create Session with SaaS data)
        await createSession(user.id.toString(), user.companyId, user.role, user.name, user.email);

        // 4. Cleanup OTP (Optional, but good practice to delete used)
        db.prepare('DELETE FROM OTP WHERE id = ?').run(otpRecord.id);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('OTP Verify Error:', error);
        return NextResponse.json({ error: 'Gagal verifikasi OTP' }, { status: 500 });
    }
}
