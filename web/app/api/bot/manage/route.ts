import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Fetch live sessions from bot service
        const botRes = await fetch(`${process.env.BOT_URL || 'http://localhost:3001'}/sessions`);
        const botData = await botRes.json();
        const liveSessions = (botData.sessions || []).filter((ls: any) => {
            // Only keep if it's NOT a temporary 'new-...' ID OR it has a real phone number
            // (authenticated sessions have the phone as ID or have a phone property)
            const isTemp = ls.id.startsWith('new-');
            return !isTemp || ls.status === 'connected';
        });

        // 2. Fetch metadata from database
        const dbBots = db.prepare('SELECT * FROM WhatsAppBot').all() as any[];

        // 3. Find which companies are using which bots
        const companyUsage = db.prepare('SELECT id, name, whatsapp_session_id FROM Company WHERE whatsapp_session_id IS NOT NULL').all() as any[];

        // 4. Merge data
        const result = liveSessions.map((ls: any) => {
            const dbBot = dbBots.find(b => b.sessionId === ls.id);
            const companies = companyUsage.filter(c => c.whatsapp_session_id === ls.id);

            return {
                ...ls,
                dbName: dbBot?.name || null,
                isGlobal: !!dbBot?.isGlobal,
                usageCount: companies.length,
                companies: companies.map(c => ({ id: c.id, name: c.name }))
            };
        });

        // Also include bots in DB that might not be live right now
        dbBots.forEach(dbb => {
            if (!result.find((r: any) => r.id === dbb.sessionId)) {
                const companies = companyUsage.filter(c => c.whatsapp_session_id === dbb.sessionId);
                result.push({
                    id: dbb.sessionId,
                    status: 'stopped',
                    phone: dbb.sessionId,
                    dbName: dbb.name,
                    isGlobal: !!dbb.isGlobal,
                    usageCount: companies.length,
                    companies: companies.map(c => ({ id: c.id, name: c.name }))
                });
            }
        });

        // 5. Get all companies so superadmin can choose
        const allCompanies = db.prepare('SELECT id, name FROM Company ORDER BY name ASC').all() as any[];

        return NextResponse.json({
            bots: result,
            allCompanies
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session || session.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { sessionId, name, isGlobal } = body;

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        // Upsert metadata
        const existing = db.prepare('SELECT id FROM WhatsAppBot WHERE sessionId = ?').get(sessionId);
        const now = new Date().toISOString();

        if (existing) {
            db.prepare(`
                UPDATE WhatsAppBot 
                SET name = ?, isGlobal = ?, updatedAt = ? 
                WHERE sessionId = ?
            `).run(name || null, isGlobal ? 1 : 0, now, sessionId);
        } else {
            db.prepare(`
                INSERT INTO WhatsAppBot (sessionId, name, isGlobal, createdBy, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(sessionId, name || null, isGlobal ? 1 : 0, session.userId, now, now);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getSession();
    if (!session || session.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        db.prepare('DELETE FROM WhatsAppBot WHERE sessionId = ?').run(sessionId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
