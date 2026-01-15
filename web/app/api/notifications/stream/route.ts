import { NextRequest } from 'next/server';
import globalEmitter, { EVENTS } from '@/lib/events';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }

    const stream = new ReadableStream({
        start(controller) {
            const sendEvent = (data: any) => {
                controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
            };

            // Listener for leave creation
            const onLeaveCreated = () => {
                sendEvent({ type: 'LEAVE_COUNT_UPDATE', timestamp: Date.now() });
            };

            globalEmitter.on(EVENTS.LEAVE_CREATED, onLeaveCreated);
            globalEmitter.on(EVENTS.LEAVE_UPDATED, onLeaveCreated);

            // Listener for WhatsApp status
            const onWhatsAppStatusChanged = () => {
                sendEvent({ type: 'WHATSAPP_STATUS_UPDATE', timestamp: Date.now() });
            };
            globalEmitter.on(EVENTS.WHATSAPP_STATUS_CHANGED, onWhatsAppStatusChanged);

            // Initial ping
            sendEvent({ type: 'CONNECTED', timestamp: Date.now() });

            // Heartbeat every 15s to keep connection alive
            const heartbeat = setInterval(() => {
                sendEvent({ type: 'HEARTBEAT', timestamp: Date.now() });
            }, 15000);

            // Handle client close
            req.signal.addEventListener('abort', () => {
                clearInterval(heartbeat);
                globalEmitter.off(EVENTS.LEAVE_CREATED, onLeaveCreated);
                globalEmitter.off(EVENTS.LEAVE_UPDATED, onLeaveCreated);
                globalEmitter.off(EVENTS.WHATSAPP_STATUS_CHANGED, onWhatsAppStatusChanged);
            });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
