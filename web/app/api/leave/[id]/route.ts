import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import globalEmitter, { EVENTS } from '@/lib/events';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Only Admin/HR can approve/reject
        if (session.role === 'EMPLOYEE' || session.role === 'STAFF') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { status } = body; // APPROVED, REJECTED

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const stmt = db.prepare(`
            UPDATE LeaveRequest 
            SET status = ?, approvedBy = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        stmt.run(status, session.userId, params.id);

        // Emit event for real-time notification update
        globalEmitter.emit(EVENTS.LEAVE_UPDATED);

        // Log Activity for Employee (Target) and Approver (Actor)
        try {
            const leave: any = db.prepare(`
                SELECT e.userId 
                FROM LeaveRequest lr 
                JOIN Employee e ON lr.employeeId = e.id 
                WHERE lr.id = ?
            `).get(params.id);

            if (leave && leave.userId) {
                // Log for requester
                db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                    .run(leave.userId, 'LEAVE_STATUS_CHANGED', `Permintaan cuti ${status} oleh penyetujui`, session.companyId);

                // Log for approver (if different)
                if (leave.userId !== session.userId) {
                    db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                        .run(session.userId, 'LEAVE_APPROVAL', `Melakukan ${status} pada permintaan cuti`, session.companyId);
                }
            }
        } catch (e) { }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
