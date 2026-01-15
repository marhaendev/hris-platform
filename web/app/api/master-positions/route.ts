
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');
        const category = searchParams.get('category');

        let query = "SELECT * FROM MasterPosition WHERE 1=1";
        const params: any[] = [];

        if (q) {
            query += " AND title LIKE ?";
            params.push(`%${q}%`);
        }

        if (category) {
            query += " AND category = ?";
            params.push(category);
        }

        query += " ORDER BY title ASC LIMIT 50";

        const stmt = db.prepare(query);
        const positions = stmt.all(...params);

        return NextResponse.json(positions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
