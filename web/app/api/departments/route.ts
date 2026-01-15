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
        const id = searchParams.get('id');

        if (id) {
            const stmt = db.prepare("SELECT * FROM Department WHERE id = ? AND companyId = ?");
            const department = stmt.get(id, session.companyId);
            if (!department) {
                return NextResponse.json({ error: "Department not found" }, { status: 404 });
            }
            return NextResponse.json(department);
        }

        const departments = db.prepare(`
            SELECT 
                d.*,
                COUNT(DISTINCT e.id) as employeeCount
            FROM Department d
            LEFT JOIN Position p ON d.id = p.departmentId
            LEFT JOIN Employee e ON p.id = e.positionId
            WHERE d.companyId = ?
            GROUP BY d.id
            ORDER BY employeeCount DESC, d.name ASC
        `).all(session.companyId);

        return NextResponse.json(departments);
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

        const { name, code } = await request.json();

        // Simple duplicate check per company (ONLY Check Name)
        const existing = db.prepare("SELECT id FROM Department WHERE name = ? AND companyId = ?").get(name, session.companyId);
        if (existing) {
            return NextResponse.json({ error: "Department name with this name already exists" }, { status: 400 });
        }

        // Insert department
        const stmt = db.prepare("INSERT INTO Department (name, code, companyId) VALUES (?, ?, ?)");
        const result = stmt.run(name, code, session.companyId);
        const departmentId = result.lastInsertRowid;

        // Auto-create default positions for the new department
        const defaultPositions = [
            { title: 'Intern', level: 'Intern' },
            { title: 'Staff', level: 'Staff' },
            { title: 'Senior Staff', level: 'Senior Staff' },
            { title: 'Supervisor', level: 'Supervisor' },
            { title: 'Manager', level: 'Manager' },
            { title: 'Director', level: 'Director' }
        ];

        const positionStmt = db.prepare("INSERT INTO Position (title, level, departmentId, companyId) VALUES (?, ?, ?, ?)");
        for (const pos of defaultPositions) {
            positionStmt.run(pos.title, pos.level, departmentId, session.companyId);
        }

        return NextResponse.json({
            id: departmentId,
            name,
            code,
            positionsCreated: defaultPositions.length
        });
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

        const { id, name, code } = await request.json();

        // Verify ownership
        const dept = db.prepare("SELECT id FROM Department WHERE id = ? AND companyId = ?").get(id, session.companyId);
        if (!dept) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const stmt = db.prepare("UPDATE Department SET name = ?, code = ? WHERE id = ? AND companyId = ?");
        stmt.run(name, code, id, session.companyId);
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

        const stmt = db.prepare("DELETE FROM Department WHERE id = ? AND companyId = ?");
        const result = stmt.run(id, session.companyId);

        if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
