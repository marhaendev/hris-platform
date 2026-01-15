import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
    try {
        const session = await getSession();

        // 1. Validasi: Hanya Superadmin (atau yang sedang simulasi Superadmin)
        if (!session || (session.role !== 'SUPERADMIN' && !session.impersonatorId)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');
        const query = searchParams.get('q') || '';

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        // 2. Ambil user berdasarkan companyId dan filter search
        // Kita exclude Superadmin sendiri agar tidak pusing
        const users = db.prepare(`
            SELECT id, name, email, role 
            FROM User 
            WHERE companyId = ? 
            AND (name LIKE ? OR email LIKE ?)
            AND role != 'SUPERADMIN'
            LIMIT 50
        `).all(companyId, `%${query}%`, `%${query}%`);

        return NextResponse.json(users);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
