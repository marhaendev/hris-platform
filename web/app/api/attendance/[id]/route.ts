import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Sesi berakhir, silakan login kembali' }, { status: 401 });

        const allowedRoles = ['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER'];
        if (!allowedRoles.includes(session.role)) {
            return NextResponse.json({ error: 'Hanya Admin atau Owner yang dapat menghapus data' }, { status: 403 });
        }

        const id = params.id;

        // Sync companyId to ensure consistency before delete check
        try {
            db.prepare(`
                UPDATE Attendance 
                SET companyId = (SELECT companyId FROM Employee WHERE id = Attendance.employeeId)
                WHERE id = ? AND companyId IS NULL
            `).run(id);
        } catch (e) { }

        let result;
        if (session.role === 'SUPERADMIN') {
            result = db.prepare('DELETE FROM Attendance WHERE id = ?').run(id);
        } else {
            // Check ownership via JOIN path (User -> Employee -> Attendance)
            // This guarantees that an owner can only delete their own company's data
            const stmt = db.prepare(`
                DELETE FROM Attendance 
                WHERE id = ? 
                AND employeeId IN (
                    SELECT e.id FROM Employee e
                    JOIN User u ON e.userId = u.id
                    WHERE u.companyId = ?
                )
            `);
            result = stmt.run(id, Number(session.companyId));
        }

        if (result.changes === 0) {
            // Check if it exists at all to provide better feedback
            const check = db.prepare('SELECT id FROM Attendance WHERE id = ?').get(id);
            if (!check) {
                return NextResponse.json({ error: 'Data tidak ditemukan (ID salah atau sudah dihapus)' }, { status: 404 });
            }
            return NextResponse.json({ error: 'Gagal: Anda tidak memiliki izin untuk menghapus data perusahaan lain' }, { status: 403 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: `Server Error: ${error.message}` }, { status: 500 });
    }
}
