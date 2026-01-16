import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { phone } = body;

        if (!phone) {
            return NextResponse.json({ error: 'Nomor HP wajib diisi' }, { status: 400 });
        }

        // Validate Phone Uniqueness again (security)
        const checkPhone = db.prepare('SELECT id FROM User WHERE phone = ? AND id != ?').get(phone, session.userId);
        if (checkPhone) {
            return NextResponse.json({ error: 'Nomor HP sudah digunakan oleh pengguna lain' }, { status: 400 });
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Get configured duration (default 5 minutes)
        const durationSetting = db.prepare("SELECT value FROM SystemSetting WHERE key = 'otp_duration_minutes'").get() as { value: string } | undefined;
        const durationMinutes = durationSetting ? parseInt(durationSetting.value) : 5;

        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

        // Save to DB
        // First delete any existing OTPs for this identifier to keep it clean
        db.prepare('DELETE FROM OTP WHERE identifier = ?').run(phone);

        db.prepare('INSERT INTO OTP (identifier, code, expiresAt) VALUES (?, ?, ?)')
            .run(phone, otpCode, expiresAt);

        // Send via WhatsApp Bot
        const botUrl = process.env.BOT_URL || 'http://localhost:3001';

        // Get custom template or use default
        const templateSetting = db.prepare("SELECT value FROM SystemSetting WHERE key = 'otp_message_template'").get() as { value: string } | undefined;
        let message = templateSetting?.value || `*Kode Verifikasi HRIS Anda*\n\nKode OTP: *{{code}}*\n\nJangan berikan kode ini kepada staf HR atau siapapun.`;

        // Replace placeholder
        message = message.replace('{{code}}', otpCode);

        const botRes = await fetch(`${botUrl}/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, message })
        });

        if (!botRes.ok) {
            const errorMsg = await botRes.text();
            throw new Error(`Bot API Error: ${errorMsg}`);
        }

        return NextResponse.json({ success: true, message: 'OTP terkirim ke WhatsApp' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
