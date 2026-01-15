import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, otpCode, newPassword } = body;

        if (!phone || !otpCode || !newPassword) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
        }

        // 1. Verifikasi OTP
        const now = new Date().toISOString();
        const otpRecord = db.prepare(`
            SELECT * FROM OTP 
            WHERE identifier = ? AND code = ? AND expiresAt > ?
            ORDER BY createdAt DESC LIMIT 1
        `).get(phone, otpCode, now) as any;

        if (!otpRecord) {
            return NextResponse.json({ error: 'Kode OTP salah atau sudah kadaluarsa' }, { status: 400 });
        }

        // 2. Pastikan user dengan nomor HP tersebut ada
        const user = db.prepare('SELECT id FROM User WHERE phone = ?').get(phone) as any;
        if (!user) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
        }

        // 3. Hash password baru
        const hashedPassword = await hashPassword(newPassword);

        // 4. Update Password User
        const updateStmt = db.prepare('UPDATE User SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
        updateStmt.run(hashedPassword, user.id);

        // 5. Hapus OTP yang sudah digunakan
        db.prepare('DELETE FROM OTP WHERE id = ?').run(otpRecord.id);

        return NextResponse.json({ success: true, message: 'Password berhasil diperbarui' });

    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: 'Gagal mereset password' }, { status: 500 });
    }
}
