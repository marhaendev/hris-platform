import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export async function GET() {
    const session = await getSession();
    if (!session || !session.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch global bots
        const globalBots = db.prepare('SELECT sessionId, name FROM WhatsAppBot WHERE isGlobal = 1').all() as any[];

        // Fetch live status for these bots
        const botRes = await fetch(`${process.env.BOT_URL || 'http://localhost:3001'}/sessions`);
        const botData = await botRes.json();
        const liveSessions = botData.sessions || [];

        const result = globalBots.map(gb => {
            const live = liveSessions.find((ls: any) => ls.id === gb.sessionId);
            return {
                id: gb.sessionId,
                name: gb.name || gb.sessionId,
                status: live ? live.status : 'stopped',
                phone: live ? live.phone : gb.sessionId
            };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session || !session.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Admin or Owner or Superadmin
    if (!['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER'].includes(session.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        // Verify it is a global bot
        const bot = db.prepare('SELECT id FROM WhatsAppBot WHERE sessionId = ? AND isGlobal = 1').get(sessionId);
        if (!bot) {
            return NextResponse.json({ error: 'Bot not found or not global' }, { status: 404 });
        }

        // Link company to this bot
        db.prepare('UPDATE Company SET whatsapp_session_id = ? WHERE id = ?').run(sessionId, session.companyId);

        return NextResponse.json({ success: true, sessionId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
