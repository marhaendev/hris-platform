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

        let query = "SELECT * FROM Position WHERE companyId = ?";
        const params: any[] = [session.companyId];

        if (id) {
            query += " AND id = ?";
            params.push(id);
        } else if (departmentId) {
            query += " AND departmentId = ?";
            params.push(departmentId);
        }

        if (id) {
            const position = db.prepare('SELECT * FROM Position WHERE id = ? AND companyId = ?').get(id, session.companyId);
            if (!position) {
                return NextResponse.json({ error: "Position not found" }, { status: 404 });
            }
            return NextResponse.json(position);
        }

        if (departmentId) {
            const positions = db.prepare('SELECT * FROM Position WHERE departmentId = ? AND companyId = ?').all(departmentId, session.companyId);
            return NextResponse.json(positions);
        }

        // Get all positions with department info and employee count
        const positions = db.prepare(`
            SELECT 
                p.*,
                d.name as department_name,
                d.code as department_code,
                COUNT(DISTINCT e.id) as employeeCount
            FROM Position p
            LEFT JOIN Department d ON p.departmentId = d.id
            LEFT JOIN Employee e ON p.id = e.positionId
            WHERE p.companyId = ?
            GROUP BY p.id
            ORDER BY employeeCount DESC, d.name, p.title
        `).all(session.companyId);

        // Transform to include department object
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

        return NextResponse.json(transformedPositions);
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
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const stmt = db.prepare("DELETE FROM Position WHERE id = ? AND companyId = ?");
        const result = stmt.run(id, session.companyId);
        if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
