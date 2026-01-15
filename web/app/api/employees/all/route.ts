import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only allow SUPERADMIN or OWNER
        if (session.role !== 'SUPERADMIN' && session.role !== 'OWNER') {
            return NextResponse.json({ error: 'Permission Denied' }, { status: 403 });
        }

        const transaction = db.transaction(() => {
            // Delete all Users who have role = 'EMPLOYEE' and companyId matches
            // ON DELETE CASCADE will handle Employee, Attendance, Payroll, LeaveRequest tables
            const stmt = db.prepare("DELETE FROM User WHERE role = 'EMPLOYEE' AND companyId = ?");
            const result = stmt.run(session.companyId);
            return result.changes;
        });

        const deletedCount = transaction();

        // Log Activity
        try {
            const insertLog = db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)');
            insertLog.run(session.id, 'MASS_DELETE', `Deleted all ${deletedCount} employees`, session.companyId);
        } catch (e) { }

        return NextResponse.json({ success: true, count: deletedCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
