import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = params.id;

        // Verify ownership and role
        const empQuery = 'SELECT e.userId, u.role, e.companyId FROM Employee e JOIN User u ON e.userId = u.id WHERE e.id = ?';
        const employee = db.prepare(empQuery).get(id) as any;

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        if (employee.companyId !== session.companyId) {
            return NextResponse.json({ error: 'Unauthorized: Different company' }, { status: 403 });
        }

        if (session.role === 'ADMIN' && employee.role === 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized: Admin cannot delete Superadmin' }, { status: 403 });
        }

        const deleteUser = db.prepare('DELETE FROM User WHERE id = ?');
        deleteUser.run(employee.userId);


        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = params.id;
        const body = await request.json();
        const { baseSalary } = body;

        // Verify ownership
        const empQuery = 'SELECT e.userId, e.companyId FROM Employee e WHERE e.id = ?';
        const employee = db.prepare(empQuery).get(id) as any;

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        if (employee.companyId !== session.companyId) {
            return NextResponse.json({ error: 'Unauthorized: Different company' }, { status: 403 });
        }

        // Add validations if needed
        if (baseSalary !== undefined) {
            const updateStmt = db.prepare('UPDATE Employee SET baseSalary = ? WHERE id = ?');
            updateStmt.run(baseSalary, id);
        }

        // Return updated data
        const updatedEmp = db.prepare(`
            SELECT e.*, u.name, u.email, u.role
            FROM Employee e
            JOIN User u ON e.userId = u.id
            WHERE e.id = ?
        `).get(id);

        return NextResponse.json(updatedEmp);

    } catch (error: any) {
        console.error("PATCH Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
