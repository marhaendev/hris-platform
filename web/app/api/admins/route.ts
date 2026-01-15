import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getSession } from '@/lib/session';

// GET: List all admins for current company
export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Allow SUPERADMIN, COMPANY_OWNER, and ADMIN
        if (session.role !== 'SUPERADMIN' && session.role !== 'COMPANY_OWNER' && session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const stmt = db.prepare(`
            SELECT id, name, email, createdAt, updatedAt
            FROM User 
            WHERE role = 'ADMIN' AND companyId = ?
            ORDER BY id DESC
        `);
        const admins = stmt.all(session.companyId);

        return NextResponse.json(admins);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create new admin
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only OWNER & SUPERADMIN can create admins
        if (session.role !== 'COMPANY_OWNER' && session.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Hanya Owner atau Superadmin yang dapat menambah Admin' }, { status: 403 });
        }

        const body = await request.json();
        const { name, email, password, phone } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 });
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
        const finalUsername = email; // Always use email as username as requested


        const insertStmt = db.prepare(`
            INSERT INTO User (name, email, password, role, companyId, createdAt, updatedAt, username, phone)
            VALUES (?, ?, ?, 'ADMIN', ?, ?, ?, ?, ?)
        `);
        const result = insertStmt.run(name, email, hashedPassword, session.companyId, now, now, finalUsername, phone || null);

        // Log Activity
        db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
            .run(result.lastInsertRowid, 'ACCOUNT_CREATED', 'Akun admin berhasil dibuat oleh Owner', session.companyId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update admin
export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only OWNER & SUPERADMIN can edit admins
        if (session.role !== 'COMPANY_OWNER' && session.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Hanya Owner atau Superadmin yang dapat mengubah Admin' }, { status: 403 });
        }

        const body = await request.json();
        const { id, name, email, password, username } = body;

        // Verify admin exists and belongs to company
        const admin = db.prepare('SELECT id, username FROM User WHERE id = ? AND role = ? AND companyId = ?')
            .get(id, 'ADMIN', session.companyId);

        if (!admin) {
            return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 });
        }

        // Validate Username Uniqueness if changed
        if (username) {
            const current = admin as any;
            if (current.username !== username) {
                const check = db.prepare('SELECT id FROM User WHERE username = ? AND id != ?').get(username, id);
                if (check) return NextResponse.json({ error: "Username sudah digunakan oleh pengguna lain" }, { status: 400 });
            }
        }

        const now = new Date().toISOString();

        if (password) {
            const hashedPassword = await hashPassword(password);
            db.prepare('UPDATE User SET name = ?, email = ?, password = ?, username = ?, updatedAt = ? WHERE id = ?')
                .run(name, email, hashedPassword, username || null, now, id);
            // Log Activity
            db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                .run(id, 'UPDATE_PROFILE', 'Profil dan password admin diperbarui oleh Owner', session.companyId);
        } else {
            db.prepare('UPDATE User SET name = ?, email = ?, username = ?, updatedAt = ? WHERE id = ?')
                .run(name, email, username || null, now, id);
            // Log Activity
            db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                .run(id, 'UPDATE_PROFILE', 'Profil admin diperbarui oleh Owner', session.companyId);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove admin
export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only OWNER & SUPERADMIN can delete admins
        if (session.role !== 'COMPANY_OWNER' && session.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Hanya Owner atau Superadmin yang dapat menghapus Admin' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
        }

        // Verify admin exists and belongs to company
        const admin = db.prepare('SELECT id FROM User WHERE id = ? AND role = ? AND companyId = ?')
            .get(id, 'ADMIN', session.companyId);

        if (!admin) {
            return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 });
        }

        db.prepare('DELETE FROM User WHERE id = ?').run(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

