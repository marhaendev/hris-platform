import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
    try {
        const session = await getSession();
        // Public job board might not require session? 
        // Typically job board is public. But the ADMIN dashboard is protected.
        // Assuming this endpoint is for ADMIN dashboard (since it returns list).
        // If public, we need separate public API or check session optional.
        // For now, let's enforce session for dashboard management.

        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // Return single item logic
        if (id) {
            const stmt = db.prepare(`
                SELECT 
                    JobPosting.*,
                    Position.title as position_name
                FROM JobPosting
                LEFT JOIN Position ON JobPosting.positionId = Position.id
                WHERE JobPosting.id = ? AND JobPosting.companyId = ?
            `);
            const job = stmt.get(id, session.companyId);
            if (job) {
                return NextResponse.json(job);
            } else {
                return NextResponse.json({ error: "Job not found" }, { status: 404 });
            }
        }

        // List logic
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('q') || '';
        const status = searchParams.get('status') || 'ALL';
        const sort = searchParams.get('sort') || 'LATEST';

        const offset = (page - 1) * limit;

        let baseQuery = `
            FROM JobPosting
            LEFT JOIN Position ON JobPosting.positionId = Position.id
            WHERE JobPosting.companyId = ?
        `;
        let params: any[] = [session.companyId];

        if (search) {
            baseQuery += " AND JobPosting.title LIKE ?";
            params.push(`%${search}%`);
        }

        if (status !== 'ALL') {
            baseQuery += " AND JobPosting.status = ?";
            params.push(status);
        }

        // Count Total
        const countStmt = db.prepare(`SELECT COUNT(*) as total ${baseQuery}`);
        const totalResult = countStmt.get(...params) as { total: number };
        const total = totalResult.total;
        const totalPages = Math.ceil(total / limit);

        // Sorting
        let orderBy = "ORDER BY JobPosting.createdAt DESC";
        if (sort === 'OLDEST') orderBy = "ORDER BY JobPosting.createdAt ASC";
        if (sort === 'AZ') orderBy = "ORDER BY JobPosting.title ASC";
        if (sort === 'ZA') orderBy = "ORDER BY JobPosting.title DESC";

        // Fetch Data
        const dataQuery = `
            SELECT 
                JobPosting.*,
                Position.title as position_name
            ${baseQuery}
            ${orderBy}
            LIMIT ? OFFSET ?
        `;

        const dataStmt = db.prepare(dataQuery);
        const jobs = dataStmt.all(...params, limit, offset);

        return NextResponse.json({
            data: jobs,
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

        const body = await request.json();
        const {
            title,
            departmentId,
            positionId,
            description,
            requirements,
            status,
            salary_min,
            salary_max,
            location,
            employment_type,
            posted_date,
            closing_date,
        } = body;

        // Auto-fill title if empty
        let finalTitle = title;
        if (!finalTitle && positionId) {
            const pos = db.prepare('SELECT title FROM Position WHERE id = ? AND companyId = ?').get(positionId, session.companyId) as { title: string };
            if (pos) {
                finalTitle = pos.title;
            }
        }

        const stmt = db.prepare(`
            INSERT INTO JobPosting (
                title, departmentId, positionId, description, requirements,
                status, salary_min, salary_max, location, employment_type,
                posted_date, closing_date, created_by, companyId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            finalTitle,
            departmentId || null,
            positionId || null,
            description || null,
            requirements || null,
            status || 'DRAFT',
            salary_min || null,
            salary_max || null,
            location || null,
            employment_type || 'FULL_TIME',
            posted_date || new Date().toISOString(),
            closing_date || null,
            session.userId,
            session.companyId
        );

        return NextResponse.json({ id: result.lastInsertRowid, ...body });
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

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        // Check ownership
        const existing = db.prepare("SELECT id FROM JobPosting WHERE id = ? AND companyId = ?").get(id, session.companyId);
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // PROTECT POSTED DATE & created_at
        // We exclude sensitive fields from updates even if sent
        delete updates.posted_date;
        delete updates.created_by;
        delete updates.createdAt;
        delete updates.companyId;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ success: true, message: "No allowed fields to update" });
        }

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);

        const stmt = db.prepare(`UPDATE JobPosting SET ${fields} WHERE id = ? AND companyId = ?`);
        stmt.run(...values, id, session.companyId);

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

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        // VALIDATION: Check if applicants exist
        const applicantCount = (db.prepare("SELECT count(*) as count FROM Applicant WHERE job_posting_id = ?").get(id) as any).count;
        if (applicantCount > 0) {
            return NextResponse.json({ error: "Cannot delete job with existing applicants." }, { status: 403 });
        }

        const stmt = db.prepare("DELETE FROM JobPosting WHERE id = ? AND companyId = ?");
        const result = stmt.run(id, session.companyId);
        if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
