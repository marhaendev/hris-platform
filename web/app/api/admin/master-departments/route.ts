import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET: Fetch all master departments
export async function GET(req: NextRequest) {
    try {
        // Optional search param
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');

        let query = "SELECT * FROM MasterDepartment ORDER BY name ASC";
        let params: any[] = [];

        if (q) {
            query = "SELECT * FROM MasterDepartment WHERE name LIKE ? OR code LIKE ? ORDER BY name ASC";
            params = [`%${q}%`, `%${q}%`];
        }

        const depts = db.prepare(query).all(...params);
        return NextResponse.json(depts);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}

// POST: Add new
export async function POST(req: NextRequest) {
    try {
        const { name, code, description } = await req.json();
        const stmt = db.prepare("INSERT INTO MasterDepartment (name, code, description) VALUES (?, ?, ?)");
        const res = stmt.run(name, code, description);
        return NextResponse.json({ id: res.lastInsertRowid, name, code, description }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}

// PUT: Update
export async function PUT(req: NextRequest) {
    try {
        const { id, name, code, description } = await req.json();
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const stmt = db.prepare("UPDATE MasterDepartment SET name = ?, code = ?, description = ? WHERE id = ?");
        stmt.run(name, code, description, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

// DELETE: Remove
export async function DELETE(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const stmt = db.prepare("DELETE FROM MasterDepartment WHERE id = ?");
        stmt.run(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
