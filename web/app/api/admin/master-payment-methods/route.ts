import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET: Fetch all payment methods
export async function GET() {
    try {
        const methods = db.prepare("SELECT * FROM MasterPaymentMethod ORDER BY id DESC").all();
        return NextResponse.json(methods);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}

// POST: Add new
export async function POST(req: NextRequest) {
    try {
        const { name, type, description } = await req.json();
        const stmt = db.prepare("INSERT INTO MasterPaymentMethod (name, type, description) VALUES (?, ?, ?)");
        const res = stmt.run(name, type, description);
        return NextResponse.json({ id: res.lastInsertRowid, name, type, description }, { status: 201 });
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

        const { name, type, description } = await req.json();
        const stmt = db.prepare("UPDATE MasterPaymentMethod SET name = ?, type = ?, description = ? WHERE id = ?");
        stmt.run(name, type, description, id);

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

        const stmt = db.prepare("DELETE FROM MasterPaymentMethod WHERE id = ?");
        stmt.run(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
