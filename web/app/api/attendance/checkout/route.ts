import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.userId;

        const empStmt = db.prepare('SELECT id FROM Employee WHERE userId = ?');
        const employee = empStmt.get(userId) as any;

        if (!employee) return NextResponse.json({ error: 'Not an employee' }, { status: 403 });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkStmt = db.prepare('SELECT id FROM Attendance WHERE employeeId = ? AND date >= ?');
        const attendance = checkStmt.get(employee.id, today.toISOString()) as any;

        if (!attendance) {
            return NextResponse.json({ error: 'Not checked in yet' }, { status: 400 });
        }

        const update = db.prepare(`
            UPDATE Attendance 
            SET checkOut = ? 
            WHERE id = ?
        `);

        update.run(new Date().toISOString(), attendance.id);

        // Log Activity
        try {
            db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                .run(session.userId, 'CHECK_OUT', 'Melakukan Absen Pulang', session.companyId);
        } catch (e) { }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
