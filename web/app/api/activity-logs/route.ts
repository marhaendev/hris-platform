import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    try {
        let baseQuery = `FROM ActivityLog al JOIN User u ON al.userId = u.id`;
        const params: any[] = [];

        if (userId) {
            baseQuery += ` WHERE al.userId = ?`;
            params.push(userId);
        }

        // Get Total Count
        const countStmt = db.prepare(`SELECT COUNT(*) as count ${baseQuery}`);
        const totalResult = countStmt.get(...params) as any;
        const totalCount = totalResult.count;
        const totalPages = Math.ceil(totalCount / limit);

        // Get Paginated Data
        const query = `
            SELECT al.*, u.name as userName 
            ${baseQuery}
            ORDER BY al.createdAt DESC 
            LIMIT ? OFFSET ?
        `;

        const logs = db.prepare(query).all(...params, limit, offset);

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages
            }
        });
    } catch (error: any) {
        console.error("Error fetching activity logs:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, action, description, ipAddress, userAgent, companyId } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: "userId and action are required" }, { status: 400 });
        }

        const stmt = db.prepare(`
            INSERT INTO ActivityLog (userId, action, description, ipAddress, userAgent, companyId)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(userId, action, description || null, ipAddress || null, userAgent || null, companyId || 1);

        return NextResponse.json({ id: result.lastInsertRowid, message: "Log created" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating activity log:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: "Unauthorized. Only SUPERADMIN can delete logs." }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const userId = searchParams.get('userId');

        if (id) {
            const stmt = db.prepare('DELETE FROM ActivityLog WHERE id = ?');
            const result = stmt.run(id);

            if (result.changes === 0) {
                return NextResponse.json({ error: "Log not found" }, { status: 404 });
            }

            try {
                db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                    .run(session.userId, 'LOG_DELETED', `Menghapus log aktivitas ID: ${id}`, session.companyId);
            } catch (e) { }

            return NextResponse.json({ success: true });
        } else if (userId) {
            const stmt = db.prepare('DELETE FROM ActivityLog WHERE userId = ?');
            const result = stmt.run(userId);

            try {
                db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                    .run(session.userId, 'LOGS_CLEARED', `Menghapus ${result.changes} log aktivitas untuk UserID: ${userId}`, session.companyId);
            } catch (e) { }

            return NextResponse.json({ success: true, count: result.changes });
        } else {
            return NextResponse.json({ error: "Log ID or UserID is required" }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
