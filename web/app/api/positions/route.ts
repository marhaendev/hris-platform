import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const departmentId = searchParams.get('departmentId');
        const id = searchParams.get('id');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('q') || '';

        // Single item fetch (existing logic)
        if (id) {
            const position = db.prepare('SELECT * FROM Position WHERE id = ? AND companyId = ?').get(id, session.companyId);
            if (!position) {
                return NextResponse.json({ error: "Position not found" }, { status: 404 });
            }
            return NextResponse.json(position);
        }

        // Fetch by department (existing logic - simplified usually for dropdowns)
        // If 'all=true' or similar param existed we could use it, but for now if departmentId is present we probably want all for that dept.
        // However, the user might want pagination even for filtered by department. 
        // Let's stick to standard list fetch logic unless specific department fetch is needed without pagination.
        // The current frontend uses departmentId filter mainly for specific cases? 
        // The generic list doesn't pass departmentId params.

        if (searchParams.get('all') === 'true') {
            const positions = db.prepare(`
                SELECT p.*, COUNT(e.id) as employeeCount
                FROM Position p
                LEFT JOIN Employee e ON p.id = e.positionId
                WHERE p.companyId = ?
                GROUP BY p.id
                ORDER BY p.title ASC
            `).all(session.companyId);
            return NextResponse.json(positions);
        }

        if (departmentId && !searchParams.has('page')) {
            const positions = db.prepare('SELECT * FROM Position WHERE departmentId = ? AND companyId = ?').all(departmentId, session.companyId);
            return NextResponse.json(positions);
        }

        const offset = (page - 1) * limit;

        // Base Query Conditions
        let whereClause = "WHERE p.companyId = ?";
        const params: any[] = [session.companyId];

        if (search) {
            whereClause += " AND (p.title LIKE ? OR p.level LIKE ? OR d.name LIKE ?)";
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (departmentId) {
            whereClause += " AND p.departmentId = ?";
            params.push(departmentId);
        }

        // Count Query
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM Position p
            LEFT JOIN Department d ON p.departmentId = d.id
            ${whereClause}
        `;
        const totalResult = db.prepare(countQuery).get(...params) as { total: number };
        const total = totalResult.total;
        const totalPages = Math.max(1, Math.ceil(total / limit));

        // Data Query
        const positions = db.prepare(`
            SELECT 
                p.*,
                d.name as department_name,
                d.code as department_code,
                COUNT(DISTINCT e.id) as employeeCount
            FROM Position p
            LEFT JOIN Department d ON p.departmentId = d.id
            LEFT JOIN Employee e ON p.id = e.positionId
            ${whereClause}
            GROUP BY p.id
            ORDER BY d.name, p.title
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        // Transform
        const transformedPositions = positions.map((pos: any) => ({
            id: pos.id,
            title: pos.title,
            level: pos.level,
            departmentId: pos.departmentId,
            employeeCount: pos.employeeCount,
            department: {
                name: pos.department_name,
                code: pos.department_code
            }
        }));

        return NextResponse.json({
            data: transformedPositions,
            metadata: {
                total,
                page,
                limit,
                totalPages
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, level, departmentId } = await request.json();
        const stmt = db.prepare("INSERT INTO Position (title, level, departmentId, companyId) VALUES (?, ?, ?, ?)");
        const result = stmt.run(title, level, departmentId, session.companyId);
        return NextResponse.json({ id: result.lastInsertRowid, title, level, departmentId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, title, level, departmentId } = await request.json();

        // Verify ownership
        const pos = db.prepare("SELECT id FROM Position WHERE id = ? AND companyId = ?").get(id, session.companyId);
        if (!pos) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const stmt = db.prepare("UPDATE Position SET title = ?, level = ?, departmentId = ? WHERE id = ? AND companyId = ?");
        stmt.run(title, level, departmentId, id, session.companyId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const departmentId = searchParams.get("departmentId");
        const onlyEmpty = searchParams.get("onlyEmpty");

        // Case 1: Delete specific Position by ID
        if (id) {
            const stmt = db.prepare("DELETE FROM Position WHERE id = ? AND companyId = ?");
            const result = stmt.run(id, session.companyId);
            if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
            return NextResponse.json({ success: true });
        }

        // Case 2: Bulk Delete Empty Positions in Department
        if (departmentId && onlyEmpty === 'true') {
            const stmt = db.prepare(`
                DELETE FROM Position 
                WHERE departmentId = ? 
                AND companyId = ? 
                AND id NOT IN (SELECT positionId FROM Employee WHERE positionId IS NOT NULL)
            `);
            const result = stmt.run(departmentId, session.companyId);
            return NextResponse.json({ success: true, deletedCount: result.changes });
        }

        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
