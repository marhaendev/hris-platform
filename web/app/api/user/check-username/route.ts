
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const excludeId = searchParams.get('excludeId');

    if (!username || username.length < 3) {
        return NextResponse.json({ available: false, message: 'Too short' });
    }

    try {
        let query = 'SELECT id FROM User WHERE username = ?';
        const params: any[] = [username];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const stmt = db.prepare(query);
        const user = stmt.get(...params);

        if (user) {
            // Suggest random
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            return NextResponse.json({
                available: false,
                message: 'Username sudah digunakan',
                suggestion: `${username}${randomSuffix}`
            });
        } else {
            return NextResponse.json({ available: true, message: 'Username tersedia' });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
