import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Auto-seed if empty for this company
        const count = (db.prepare("SELECT count(*) as count FROM RolePermission WHERE companyId = ?").get(session.companyId) as any).count;

        if (count === 0) {
            const insertPerm = db.prepare(`
                INSERT OR IGNORE INTO RolePermission (companyId, role, menu_id, can_view) 
                VALUES (?, ?, ?, ?)
            `);

            const allMenus = [
                'overview-dashboard', 'overview-analytics',
                'hr-employees', 'hr-organization', 'hr-documents', 'hr-recruitment',
                'attendance-attendance', 'attendance-shifts',
                'finance-payroll',
                'system-whatsapp', 'system-settings'
            ];
            const staffMenus = ['overview-dashboard', 'attendance-attendance', 'attendance-shifts', 'system-settings'];

            const transaction = db.transaction(() => {
                // Admin Roles
                ['SUPERADMIN', 'COMPANY_OWNER', 'ADMIN', 'HR'].forEach(role => {
                    allMenus.forEach(menuId => insertPerm.run(session.companyId, role, menuId, 1));
                });
                // Finance Role
                ['FINANCE'].forEach(role => {
                    const financeMenus = ['overview-dashboard', 'finance-payroll', 'attendance-attendance', 'system-settings'];
                    financeMenus.forEach(menuId => insertPerm.run(session.companyId, role, menuId, 1));
                });
                // Staff Role
                ['STAFF', 'EMPLOYEE'].forEach(role => {
                    staffMenus.forEach(menuId => insertPerm.run(session.companyId, role, menuId, 1));
                });
            });
            transaction();
        }

        const permissions = db.prepare(`
            SELECT role, menu_id, can_view 
            FROM RolePermission 
            WHERE companyId = ?
        `).all(session.companyId);

        return NextResponse.json({ permissions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Owner/Admin can change permissions
    if (!['SUPERADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(session.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { role, menu_id, can_view } = body;

        if (!role || !menu_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const stmt = db.prepare(`
            INSERT INTO RolePermission (companyId, role, menu_id, can_view)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(companyId, role, menu_id) 
            DO UPDATE SET can_view = excluded.can_view
        `);

        stmt.run(session.companyId, role, menu_id, can_view ? 1 : 0);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
