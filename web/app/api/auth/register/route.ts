import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password, phone, companyName } = body; // ADDED companyName

        if (!name || !email || !password || !companyName) {
            return NextResponse.json({ error: 'Data nama, email, password, dan perusahaan wajib diisi' }, { status: 400 });
        }

        const checkEmail = db.prepare('SELECT id FROM User WHERE email = ?').get(email);
        if (checkEmail) {
            return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
        }

        if (phone) {
            const checkPhone = db.prepare('SELECT id FROM User WHERE phone = ?').get(phone);
            if (checkPhone) {
                return NextResponse.json({ error: 'Nomor HP sudah terdaftar' }, { status: 400 });
            }
        }

        const hashedPassword = await hashPassword(password);

        // Transaction: Create Company -> Create User (COMPANY_OWNER)
        const transaction = db.transaction(() => {
            // 1. Create Company
            const insertCompany = db.prepare('INSERT INTO Company (name, subscription_plan) VALUES (?, ?)');
            const comp = insertCompany.run(companyName, 'FREE');
            const companyId = comp.lastInsertRowid;

            // 2. Create User
            const insertUser = db.prepare(`
                INSERT INTO User (name, email, username, password, phone, role, companyId)
                VALUES (?, ?, ?, ?, ?, 'COMPANY_OWNER', ?)
            `);
            const usr = insertUser.run(name, email, email, hashedPassword, phone || null, companyId);
            return { userId: usr.lastInsertRowid, companyId };
        });

        const { userId, companyId } = transaction();

        // Auto Login with SaaS context
        await createSession(userId.toString(), Number(companyId), 'COMPANY_OWNER', name, email);

        return NextResponse.json({ success: true, userId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
