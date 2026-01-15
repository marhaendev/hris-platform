import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone } = body;

        if (!phone) {
            return NextResponse.json({ error: 'Nomor HP wajib diisi' }, { status: 400 });
        }

        // 1. Check if user exists with this phone
        const user = db.prepare('SELECT id FROM User WHERE phone = ?').get(phone);
        if (!user) {
            // For security, maybe don't reveal? But for internal tool/UX, better to say.
            // "Nomor HP belum terdaftar. Hubungi admin."
            // But honestly, for "Bisa pake email atau no hp", user might expect to just enter phone.
            return NextResponse.json({ error: 'Nomor HP tidak terdaftar pada sistem.' }, { status: 404 });
        }

        // 2. Generate OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

        // 3. Save to DB
        const stmt = db.prepare('INSERT INTO OTP (identifier, code, expiresAt) VALUES (?, ?, ?)');
        stmt.run(phone, code, expiresAt);

        // 4. Send via WhatsApp Bot
        try {
            // Use 'bot' service name in Docker network, fallback to localhost for local dev outside docker
            const botUrl = process.env.BOT_URL || 'http://bot:3001';
            const botRes = await fetch(`${botUrl}/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phone,
                    message: `*HRIS OTP*\n\nKode verifikasi Anda adalah: *${code}*\n\nJangan berikan kode ini kepada siapapun.`
                })
            });

            if (!botRes.ok) {
                console.error("Bot API Error:", await botRes.text());
                // Fallback to console log if bot fails (for dev)
                console.log(`[OTP-FALLBACK] OTP dikirim ke ${phone}: ${code}`);
            }
        } catch (botErr) {
            console.error("Failed to connect to Bot Service:", botErr);
            console.log(`[OTP-FALLBACK] OTP dikirim ke ${phone}: ${code}`);
        }

        return NextResponse.json({ success: true, message: 'OTP telah dikirim ke WhatsApp Anda.' });

    } catch (error: any) {
        console.error('OTP Send Error:', error);
        return NextResponse.json({ error: 'Gagal mengirim OTP' }, { status: 500 });
    }
}
