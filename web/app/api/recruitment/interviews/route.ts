import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const applicant_id = searchParams.get('applicant_id');

        let query = "SELECT * FROM Interview";
        const params: any[] = [];
        const conditions: string[] = [];

        if (id) {
            conditions.push("id = ?");
            params.push(id);
        }
        if (applicant_id) {
            conditions.push("applicant_id = ?");
            params.push(applicant_id);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY scheduled_date DESC";

        const stmt = db.prepare(query);
        const interviews = stmt.all(...params);

        if (id) {
            if (interviews.length > 0) {
                return NextResponse.json(interviews[0]);
            } else {
                return NextResponse.json({ error: "Interview not found" }, { status: 404 });
            }
        }

        return NextResponse.json(interviews);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            applicant_id,
            interviewer_id,
            scheduled_date,
            type,
            status,
            notes,
            rating
        } = body;

        const stmt = db.prepare(`
            INSERT INTO Interview (
                applicant_id, interviewer_id, scheduled_date, type,
                status, notes, rating
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            applicant_id,
            interviewer_id || null,
            scheduled_date || null,
            type || 'ONSITE',
            status || 'SCHEDULED',
            notes || null,
            rating || null
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

        const stmt = db.prepare(`UPDATE Interview SET ${fields} WHERE id = ?`);
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

        const stmt = db.prepare("DELETE FROM Interview WHERE id = ?");
        stmt.run(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
