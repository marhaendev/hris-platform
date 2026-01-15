import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const jobId = searchParams.get('jobId');
        const status = searchParams.get('status');

        let query = "SELECT * FROM Applicant";
        const params: any[] = [];
        const conditions: string[] = [];

        if (id) {
            conditions.push("id = ?");
            params.push(id);
        }
        if (jobId) {
            conditions.push("jobId = ?");
            params.push(jobId);
        }
        if (status) {
            conditions.push("status = ?");
            params.push(status);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY applied_date DESC";

        const stmt = db.prepare(query);
        const applicants = stmt.all(...params);

        if (id) {
            if (applicants.length > 0) {
                return NextResponse.json(applicants[0]);
            } else {
                return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
            }
        }

        return NextResponse.json(applicants);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            jobId,
            name,
            email,
            phone,
            resume_url,
            cover_letter,
            status,
            notes
        } = body;

        const stmt = db.prepare(`
            INSERT INTO Applicant (
                jobId, name, email, phone, resume_url,
                cover_letter, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            jobId,
            name,
            email,
            phone || null,
            resume_url || null,
            cover_letter || null,
            status || 'NEW',
            notes || null
        );

        return NextResponse.json({ id: result.lastInsertRowid, ...body });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);

        const stmt = db.prepare(`UPDATE Applicant SET ${fields} WHERE id = ?`);
        stmt.run(...values, id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        const stmt = db.prepare("DELETE FROM Applicant WHERE id = ?");
        stmt.run(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
