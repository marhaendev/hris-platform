import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getSession } from '@/lib/session';

const SUPERADMIN_ROLE = 'SUPERADMIN';

// GET: List all owners (Superadmin only)
export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== SUPERADMIN_ROLE) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const all = searchParams.get('all') === 'true';

        let query = `
            SELECT u.id, u.name, u.email, u.companyId, c.name as companyName, u.createdAt, u.updatedAt
            FROM User u
            JOIN Company c ON u.companyId = c.id
            WHERE u.role = 'COMPANY_OWNER'
        `;

        const params = [];

        // DEFAULT: Only show owners for the currently active company
        if (!all) {
            query += " AND u.companyId = ?";
            params.push(session.companyId);
        }

        query += " ORDER BY u.id DESC";

        const owners = db.prepare(query).all(...params);
        return NextResponse.json(owners);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create new owner
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== SUPERADMIN_ROLE) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, password, companyId } = body;

        if (!name || !email || !password || !companyId) {
            return NextResponse.json({ error: 'Nama, email, password, dan Perusahaan wajib diisi' }, { status: 400 });
        }

        const { validatePassword } = require('@/lib/auth');
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.isValid) {
            return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
        }

        // Check if email exists
        const checkStmt = db.prepare('SELECT id FROM User WHERE email = ?');
        if (checkStmt.get(email)) {
            return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);
        const now = new Date().toISOString();

        const insertStmt = db.prepare(`
            INSERT INTO User (name, email, username, password, role, companyId, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, 'COMPANY_OWNER', ?, ?, ?)
        `);
        const result = insertStmt.run(name, email, email, hashedPassword, companyId, now, now);

        // Log Activity
        db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
            .run(result.lastInsertRowid, 'ACCOUNT_CREATED', 'Akun owner berhasil dibuat oleh Superadmin', companyId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update owner
export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== SUPERADMIN_ROLE) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, name, email, password, companyId } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
        }

        // Verify owner exists
        const owner = db.prepare('SELECT id FROM User WHERE id = ? AND role = ?').get(id, 'COMPANY_OWNER');
        if (!owner) {
            return NextResponse.json({ error: 'Owner tidak ditemukan' }, { status: 404 });
        }

        const now = new Date().toISOString();

        if (password) {
            const hashedPassword = await hashPassword(password);
            db.prepare('UPDATE User SET name = ?, email = ?, username = ?, password = ?, companyId = ?, updatedAt = ? WHERE id = ?')
                .run(name, email, email, hashedPassword, companyId, now, id);
        } else {
            db.prepare('UPDATE User SET name = ?, email = ?, username = ?, companyId = ?, updatedAt = ? WHERE id = ?')
                .run(name, email, email, companyId, now, id);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove owner
export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== SUPERADMIN_ROLE) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
        }

        // Verify owner exists
        const owner = db.prepare('SELECT id FROM User WHERE id = ? AND role = ?').get(id, 'COMPANY_OWNER');
        if (!owner) {
            return NextResponse.json({ error: 'Owner tidak ditemukan' }, { status: 404 });
        }

        // Check if this is a last owner of the company? 
        // In this system, one company can have multiple owners? 
        // For now, just delete.

        db.prepare('DELETE FROM User WHERE id = ?').run(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
