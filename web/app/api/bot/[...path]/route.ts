import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
    const session = await getSession();
    if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN' && session.role !== 'COMPANY_OWNER')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const path = params.path.join('/');
    const botUrl = process.env.BOT_URL || 'http://localhost:3001';

    console.log(`[Proxy] GET Request to: ${botUrl}/${path}`);

    try {
        const res = await fetch(`${botUrl}/${path}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!res.ok) {
            console.error(`[Proxy] Bot returned status: ${res.status}`);
            const text = await res.text();
            return NextResponse.json({ error: `Bot Error ${res.status}`, details: text }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[Proxy] GET Connection Error:", error);
        return NextResponse.json({
            error: 'Failed to connect to bot service',
            details: String(error),
            url: `${botUrl}/${path}`
        }, { status: 502 });
    }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
    const session = await getSession();
    if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN' && session.role !== 'COMPANY_OWNER')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const path = params.path.join('/');
    const botUrl = process.env.BOT_URL || 'http://localhost:3001';

    console.log(`[Proxy] POST Request to: ${botUrl}/${path}`);

    try {
        let body = {};
        try {
            const text = await request.text();
            if (text) body = JSON.parse(text);
        } catch (e) {
            console.warn("[Proxy] Could not parse request body");
        }

        const res = await fetch(`${botUrl}/${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error(`[Proxy] Bot returned status: ${res.status}`);
            const text = await res.text();
            return NextResponse.json({ error: `Bot Error ${res.status}`, details: text }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[Proxy] POST Connection Error:", error);
        return NextResponse.json({
            error: 'Failed to connect to bot service',
            details: String(error),
            url: `${botUrl}/${path}`
        }, { status: 502 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
    const session = await getSession();
    if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN' && session.role !== 'COMPANY_OWNER')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const path = params.path.join('/');
    const botUrl = process.env.BOT_URL || 'http://localhost:3001';

    console.log(`[Proxy] DELETE Request to: ${botUrl}/${path}`);

    try {
        const res = await fetch(`${botUrl}/${path}`, {
            method: 'DELETE',
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!res.ok) {
            console.error(`[Proxy] Bot returned status: ${res.status}`);
            const text = await res.text();
            return NextResponse.json({ error: `Bot Error ${res.status}`, details: text }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[Proxy] DELETE Connection Error:", error);
        return NextResponse.json({
            error: 'Failed to connect to bot service',
            details: String(error),
            url: `${botUrl}/${path}`
        }, { status: 502 });
    }
}
