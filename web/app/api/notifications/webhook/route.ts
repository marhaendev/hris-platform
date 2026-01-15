import { NextRequest, NextResponse } from 'next/server';
import globalEmitter, { EVENTS } from '@/lib/events';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { event, sessionId } = body;

        if (event === 'WHATSAPP_STATUS_CHANGED') {
            console.log(`[Webhook] Triggering WHATSAPP_STATUS_CHANGED for session: ${sessionId}`);
            globalEmitter.emit(EVENTS.WHATSAPP_STATUS_CHANGED, { sessionId });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
    } catch (err) {
        console.error('[Webhook] Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
