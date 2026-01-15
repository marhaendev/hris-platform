import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session || !session.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const company = db.prepare('SELECT whatsapp_session_id FROM Company WHERE id = ?').get(session.companyId) as any;
        return NextResponse.json({ sessionId: company?.whatsapp_session_id || null });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session || !session.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admin/Owner/Superadmin
    if (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN' && session.role !== 'COMPANY_OWNER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        db.prepare('UPDATE Company SET whatsapp_session_id = ? WHERE id = ?').run(sessionId, session.companyId);

        return NextResponse.json({ success: true, sessionId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getSession();
    if (!session || !session.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN' && session.role !== 'COMPANY_OWNER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        db.prepare('UPDATE Company SET whatsapp_session_id = NULL WHERE id = ?').run(session.companyId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
