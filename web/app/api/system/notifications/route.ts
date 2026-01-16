import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

// GET: Ambil daftar notifikasi (Filtered by targetRoles and category for RBAC visibility)
export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session;
    const { searchParams } = new URL(req.url);
    const management = searchParams.get('management') === 'true';
    const locale = searchParams.get('locale') || 'id';

    try {
        let notifications;
        if (management) {
            // Role check for management
            if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN' && user.role !== 'COMPANY_OWNER') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            // Admins can see everything in management but might be restricted on EDIT/DELETE later
            notifications = db.prepare('SELECT * FROM Notification WHERE companyId = ? ORDER BY createdAt DESC')
                .all(user.companyId || 1);
        } else {
            notifications = db.prepare(`
                SELECT * FROM Notification 
                WHERE isActive = 1 
                AND companyId = ? 
                AND (targetRoles LIKE ? OR targetRoles = '*') 
                ORDER BY createdAt DESC
            `).all(user.companyId || 1, `%${user.role}%`);

            // Check for pending leave requests count (Admins only)
            if (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'COMPANY_OWNER') {
                const pendingCount = db.prepare("SELECT COUNT(*) as count FROM LeaveRequest WHERE status = 'PENDING' AND (SELECT companyId FROM Employee WHERE id = employeeId) = ?")
                    .get(user.companyId || 1) as { count: number };

                if (pendingCount && pendingCount.count > 0) {
                    notifications.unshift({
                        id: 'pending-leave-count',
                        title: locale === 'en' ? 'Pending Leave Requests' : 'Pengajuan Cuti Menunggu',
                        message: locale === 'en'
                            ? `There are ${pendingCount.count} leave requests pending approval.`
                            : `Ada ${pendingCount.count} pengajuan cuti menunggu persetujuan.`,
                        type: 'info',
                        href: '/dashboard/activities/leave',
                        category: 'leave',
                        isActive: 1,
                        createdAt: new Date().toISOString()
                    });
                }
            }
        }

        return NextResponse.json({ notifications });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Buat notifikasi baru
export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session;
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN' && user.role !== 'COMPANY_OWNER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, message, type, href, targetRoles, category } = body;

        // RBAC: Admin can't create 'system' notifications
        if ((user.role === 'ADMIN' || user.role === 'COMPANY_OWNER') && (category === 'system' || category === 'wa')) {
            return NextResponse.json({ error: 'Hanya Superadmin yang dapat membuat notifikasi sistem' }, { status: 403 });
        }

        const stmt = db.prepare(`
            INSERT INTO Notification (title, message, type, href, targetRoles, category, companyId)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            title,
            message,
            type || 'info',
            href || null,
            targetRoles || 'ADMIN,SUPERADMIN,EMPLOYEE',
            category || 'general',
            user.companyId || 1
        );

        return NextResponse.json({ id: result.lastInsertRowid, success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT/PATCH: Update notifikasi
export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session;
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN' && user.role !== 'COMPANY_OWNER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, title, message, type, href, targetRoles, category, isActive } = body;

        // Check original category before update
        const existing = db.prepare('SELECT category FROM Notification WHERE id = ? AND companyId = ?')
            .get(id, user.companyId || 1) as any;

        if (!existing) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });

        // RBAC: Admin can't edit system/wa notifications
        if ((user.role === 'ADMIN' || user.role === 'COMPANY_OWNER') && (existing.category === 'system' || existing.category === 'wa')) {
            return NextResponse.json({ error: 'Hanya Superadmin yang dapat mengubah notifikasi sistem' }, { status: 403 });
        }

        const stmt = db.prepare(`
            UPDATE Notification 
            SET title = ?, message = ?, type = ?, href = ?, targetRoles = ?, category = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ? AND companyId = ?
        `);

        stmt.run(
            title, message, type, href, targetRoles, category, isActive ? 1 : 0, id, user.companyId || 1
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Hapus notifikasi
export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session;
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN' && user.role !== 'COMPANY_OWNER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        // Check original category
        const existing = db.prepare('SELECT category FROM Notification WHERE id = ? AND companyId = ?')
            .get(id, user.companyId || 1) as any;

        if (!existing) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });

        // RBAC: Admin can't delete system/wa notifications
        if ((user.role === 'ADMIN' || user.role === 'COMPANY_OWNER') && (existing.category === 'system' || existing.category === 'wa')) {
            return NextResponse.json({ error: 'Hanya Superadmin yang dapat menghapus notifikasi sistem' }, { status: 403 });
        }

        db.prepare('DELETE FROM Notification WHERE id = ? AND companyId = ?').run(id, user.companyId || 1);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
