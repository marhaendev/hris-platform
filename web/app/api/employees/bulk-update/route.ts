import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, id, baseSalary } = body; // type: 'department' | 'position'

        if (!baseSalary || isNaN(Number(baseSalary))) {
            return NextResponse.json({ error: 'Gaji pokok tidak valid' }, { status: 400 });
        }

        if (!id) {
            return NextResponse.json({ error: 'Target (Departemen/Posisi) wajib dipilih' }, { status: 400 });
        }

        const salary = Number(baseSalary);

        let query = '';
        let params: any[] = [];

        if (type === 'department') {
            // Update by Department ID
            // Handle 'Unassigned' or 0/null? Assuming dropdown sends valid ID.
            query = `UPDATE Employee SET baseSalary = ? WHERE departmentId = ? AND companyId = ?`;
            params = [salary, id, session.companyId];
        } else if (type === 'position') {
            // Update by Position (Text or ID? The existing data has mixed usage but page.tsx uses text)
            // page.tsx filters by 'position' string. api/employees GET returns 'position' (title).
            // Let's assume we match by the string value stored in 'position' column for now, 
            // OR checks against Position table if id provided.
            // But looking at existing page.tsx, uniquePositions are strings.
            // If we want to be safe, we update where position = ?.
            query = `UPDATE Employee SET baseSalary = ? WHERE position = ? AND companyId = ?`;
            params = [salary, id, session.companyId];
        } else {
            return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
        }

        const stmt = db.prepare(query);
        const result = stmt.run(...params);

        return NextResponse.json({
            success: true,
            message: `Berhasil memperbarui gaji untuk ${result.changes} karyawan`,
            changes: result.changes
        });

    } catch (error: any) {
        console.error("Bulk Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
