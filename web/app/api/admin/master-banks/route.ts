import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET: Fetch all banks
export async function GET() {
    try {
        const banks = db.prepare("SELECT * FROM MasterBank ORDER BY name ASC").all();
        return NextResponse.json(banks);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}

// POST: Add new
export async function POST(req: NextRequest) {
    try {
        const { code, name } = await req.json();
        const stmt = db.prepare("INSERT INTO MasterBank (code, name) VALUES (?, ?)");
        const res = stmt.run(code, name);
        return NextResponse.json({ id: res.lastInsertRowid, code, name }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}

// PUT: Update
export async function PUT(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const { code, name } = await req.json();
        const stmt = db.prepare("UPDATE MasterBank SET code = ?, name = ? WHERE id = ?");
        stmt.run(code, name, id);

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

        const stmt = db.prepare("DELETE FROM MasterBank WHERE id = ?");
        stmt.run(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
