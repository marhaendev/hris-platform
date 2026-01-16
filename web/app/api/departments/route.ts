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
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('q') || '';

        if (id) {
            const stmt = db.prepare("SELECT * FROM Department WHERE id = ? AND companyId = ?");
            const department = stmt.get(id, session.companyId);
            if (!department) {
                return NextResponse.json({ error: "Department not found" }, { status: 404 });
            }
            return NextResponse.json(department);
        }

        if (searchParams.get('all') === 'true') {
            const departments = db.prepare("SELECT * FROM Department WHERE companyId = ? ORDER BY name ASC").all(session.companyId);
            return NextResponse.json(departments);
        }

        const offset = (page - 1) * limit;

        // Count total for pagination metadata
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM Department 
            WHERE companyId = ? 
            AND (name LIKE ? OR code LIKE ?)
        `;
        const totalResult = db.prepare(countQuery).get(session.companyId, `%${search}%`, `%${search}%`) as { total: number };
        const total = totalResult.total;
        const totalPages = Math.max(1, Math.ceil(total / limit));

        // Get paginated data
        const departments = db.prepare(`
            SELECT 
                d.*,
                COUNT(DISTINCT e.id) as employeeCount
            FROM Department d
            LEFT JOIN Position p ON d.id = p.departmentId
            LEFT JOIN Employee e ON p.id = e.positionId
            WHERE d.companyId = ?
            AND (d.name LIKE ? OR d.code LIKE ?)
            GROUP BY d.id
            ORDER BY d.name ASC
            LIMIT ? OFFSET ?
        `).all(session.companyId, `%${search}%`, `%${search}%`, limit, offset);

        return NextResponse.json({
            data: departments,
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

        let { name, code } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Department name is required" }, { status: 400 });
        }

        // Simple duplicate check per company (ONLY Check Name)
        const existing = db.prepare("SELECT id FROM Department WHERE name = ? AND companyId = ?").get(name, session.companyId);
        if (existing) {
            return NextResponse.json({ error: "Department name with this name already exists" }, { status: 400 });
        }

        // Auto-generate code if not provided
        if (!code) {
            const words = name.split(' ');
            if (words.length === 1) {
                code = words[0].substring(0, 3).toUpperCase();
            } else {
                code = words.map((w: string) => w[0]).join('').substring(0, 4).toUpperCase();
            }

            // Verify uniqueness of code
            let isUnique = false;
            let counter = 1;
            let baseCode = code;

            while (!isUnique) {
                const existingCode = db.prepare("SELECT id FROM Department WHERE code = ? AND companyId = ?").get(code, session.companyId);
                if (!existingCode) {
                    isUnique = true;
                } else {
                    code = `${baseCode}${counter}`;
                    counter++;
                }
            }
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
