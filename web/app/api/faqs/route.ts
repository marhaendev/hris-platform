import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
    try {
        const faqs = db.prepare('SELECT * FROM FAQ ORDER BY display_order ASC, created_at DESC').all();
        return NextResponse.json(faqs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { question, answer, is_active, display_order } = body;

        const stmt = db.prepare(`
            INSERT INTO FAQ (question, answer, is_active, display_order)
            VALUES (?, ?, ?, ?)
        `);

        const result = stmt.run(
            question,
            answer,
            is_active !== undefined ? is_active : 1,
            display_order || 0
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

        // Add updated_at trigger logic manually if needed, or rely on db trigger if exists. 
        // For simplicity, we just update the fields passed.
        // We typically want to update 'updated_at' too.

        const stmt = db.prepare(`UPDATE FAQ SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
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

        const stmt = db.prepare("DELETE FROM FAQ WHERE id = ?");
        stmt.run(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
