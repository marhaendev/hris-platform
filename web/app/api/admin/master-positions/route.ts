
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { title, defaultLevel, category } = await request.json();

        // Check duplicate
        const existing = db.prepare("SELECT id FROM MasterPosition WHERE title = ?").get(title);
        if (existing) {
            return NextResponse.json({ error: "Position title already exists in Core" }, { status: 400 });
        }

        const stmt = db.prepare("INSERT INTO MasterPosition (title, defaultLevel, category) VALUES (?, ?, ?)");
        stmt.run(title, defaultLevel || 'Staff', category || 'General');

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id, title, defaultLevel, category } = await request.json();

        const stmt = db.prepare("UPDATE MasterPosition SET title = ?, defaultLevel = ?, category = ? WHERE id = ?");
        stmt.run(title, defaultLevel, category, id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        const stmt = db.prepare("DELETE FROM MasterPosition WHERE id = ?");
        stmt.run(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
