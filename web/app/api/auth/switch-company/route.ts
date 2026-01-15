import { NextResponse } from 'next/server';
import { getSession, createSession } from '@/lib/session';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Hanya SUPERADMIN yang diizinkan untuk switch company secara bebas
        if (session.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Forbidden: Only Superadmin can switch companies' }, { status: 403 });
        }

        const body = await request.json();
        const { companyId } = body;

        if (companyId === 0) {
            // Switch to Global Context
            await createSession(
                session.userId,
                0, // Global ID is 0
                session.role,
                session.name,
                session.email,
                session.phone
            );
            return NextResponse.json({ success: true, message: 'Switched to Global context' });
        }

        // Verifikasi bahwa perusahaan tersebut memang ada
        const companyExists = db.prepare('SELECT id FROM Company WHERE id = ?').get(companyId);
        if (!companyExists) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Perbarui session dengan companyId yang baru
        await createSession(
            session.userId,
            companyId,
            session.role,
            session.name,
            session.email,
            session.phone
        );

        console.log(`[AUTH] User ${session.userId} switched to companyId ${companyId}`);

        return NextResponse.json({ success: true, message: 'Switched company successfully' });

    } catch (error: any) {
        console.error('[AUTH] Switch company error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
