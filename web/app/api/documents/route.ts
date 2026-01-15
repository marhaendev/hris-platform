
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const stmt = db.prepare(`
            SELECT d.*, u.name as employeeName
            FROM EmployeeDocument d
            JOIN Employee e ON d.employeeId = e.id
            JOIN User u ON e.userId = u.id
            ORDER BY d.uploadedAt DESC
        `);
        const documents = stmt.all();
        return NextResponse.json(documents);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
