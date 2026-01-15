import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import globalEmitter, { EVENTS } from '@/lib/events';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employeeId');
        const employeeIds = searchParams.get('employeeIds');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        let queryBase = `
            FROM LeaveRequest lr
            JOIN Employee e ON lr.employeeId = e.id
            JOIN User u ON e.userId = u.id
            LEFT JOIN User au ON lr.approvedBy = au.id
            WHERE 1=1
        `;

        if (session.role === 'ADMIN') {
            queryBase += ` AND u.role != 'SUPERADMIN' `;
        }
        const params: any[] = [];

        // Role-based restrictions
        if (session.role === 'EMPLOYEE' || session.role === 'STAFF') {
            const employee = db.prepare('SELECT id FROM Employee WHERE userId = ?').get(session.userId) as any;
            if (!employee) return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
            queryBase += ` AND lr.employeeId = ?`;
            params.push(employee.id);
        } else {
            // Admin/Superadmin filters
            if (employeeId) {
                queryBase += ` AND lr.employeeId = ?`;
                params.push(employeeId);
            } else if (employeeIds) {
                const ids = employeeIds.split(',').filter(id => id.trim());
                if (ids.length > 0) {
                    queryBase += ` AND lr.employeeId IN (${ids.map(() => '?').join(',')})`;
                    params.push(...ids);
                }
            }
        }

        // Common dynamic filters
        if (startDate) {
            queryBase += ` AND lr.startDate >= ?`;
            params.push(startDate.includes('T') ? startDate.split('T')[0] : startDate);
        }
        if (endDate) {
            queryBase += ` AND lr.endDate <= ?`;
            params.push(endDate.includes('T') ? endDate.split('T')[0] : endDate);
        }
        if (status && status !== 'ALL') {
            queryBase += ` AND lr.status = ?`;
            params.push(status);
        }
        if (type && type !== 'ALL') {
            queryBase += ` AND lr.type = ?`;
            params.push(type);
        }
        if (search) {
            queryBase += ` AND (u.name LIKE ? OR lr.reason LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        // Get Total Count for Pagination
        const totalResult = db.prepare(`SELECT COUNT(*) as count ${queryBase}`).get(...params) as any;
        const totalCount = totalResult?.count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        // Get Data with Limit and Offset
        let queryData = `SELECT lr.*, e.userId, u.name as employeeName, au.name as approverName ${queryBase}`;
        queryData += ` ORDER BY lr.createdAt DESC LIMIT ? OFFSET ?`;

        const leaves = db.prepare(queryData).all(...params, limit, offset) as any[];

        // Quota Stats (Only if single employee view or self view)
        let quota = null;
        if (session.role === 'EMPLOYEE' || session.role === 'STAFF' || employeeId) {
            const empId = employeeId || (db.prepare('SELECT id FROM Employee WHERE userId = ?').get(session.userId) as any)?.id;

            if (empId) {
                const employee = db.prepare('SELECT annualLeaveQuota FROM Employee WHERE id = ?').get(empId) as any;
                const annualQuota = employee?.annualLeaveQuota || 12;

                // Calculate used quota from APPROVED ANNUAL leaves
                const result = db.prepare(`
                    SELECT SUM(ABS(JulianDay(endDate) - JulianDay(startDate)) + 1) AS used 
                    FROM LeaveRequest 
                    WHERE employeeId = ? AND status = 'APPROVED' AND type = 'ANNUAL'
                `).get(empId) as any;

                const usedQuota = result?.used || 0;
                quota = {
                    annualQuota,
                    usedQuota,
                    remainingQuota: annualQuota - usedQuota
                };
            }
        }

        return NextResponse.json({
            leaves,
            quota,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { type, startDate, endDate, reason, attachment } = body;

        // Get Employee ID
        const employee = db.prepare('SELECT id, annualLeaveQuota FROM Employee WHERE userId = ?').get(session.userId) as any;
        if (!employee) return NextResponse.json({ error: 'Only employees can request leave' }, { status: 403 });

        // Quota check for ANNUAL leave
        if (type === 'ANNUAL') {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const requestedDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            const usedResult = db.prepare(`
                SELECT SUM(ABS(JulianDay(endDate) - JulianDay(startDate)) + 1) AS used 
                FROM LeaveRequest 
                WHERE employeeId = ? AND status = 'APPROVED' AND type = 'ANNUAL'
            `).get(employee.id) as any;

            const usedQuota = usedResult?.used || 0;
            const remaining = (employee.annualLeaveQuota || 12) - usedQuota;

            if (requestedDays > remaining) {
                return NextResponse.json({
                    error: `Kuota cuti tidak mencukupi. Sisa: ${remaining} hari, Diminta: ${requestedDays} hari.`
                }, { status: 400 });
            }
        }

        let attachmentPath = null;
        if (attachment && attachment.includes(';base64,')) {
            const parts = attachment.split(';base64,');
            const mimeType = parts[0].split(':')[1];
            const extension = mimeType.split('/')[1];
            const buffer = Buffer.from(parts[1], 'base64');

            const fileName = `leave_${Date.now()}.${extension}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'leaves');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            attachmentPath = `/uploads/leaves/${fileName}`;
        }

        const stmt = db.prepare(`
            INSERT INTO LeaveRequest (employeeId, type, startDate, endDate, reason, attachment, status)
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
        `);

        const result = stmt.run(employee.id, type, startDate, endDate, reason, attachmentPath);

        // Emit event for real-time notification
        globalEmitter.emit(EVENTS.LEAVE_CREATED);

        // Log Activity
        try {
            db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                .run(session.userId, 'LEAVE_REQUEST_CREATED', `Mengajukan cuti ${type}`, session.companyId);
        } catch (e) { }

        return NextResponse.json({ success: true, id: result.lastInsertRowid });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
