import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.userId;

        // Parse query params
        const url = new URL(request.url);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');

        const empStmt = db.prepare('SELECT id FROM Employee WHERE userId = ?');
        let employee = empStmt.get(userId) as any;

        if (!employee) {
            // Auto-create basic employee profile for Admins/Owners
            if (session.role === 'ADMIN' || session.role === 'SUPERADMIN' || session.role === 'COMPANY_OWNER') {
                const insertEmp = db.prepare('INSERT INTO Employee (userId, baseSalary, position) VALUES (?, ?, ?)');
                const result = insertEmp.run(userId, 0, session.role);
                employee = { id: result.lastInsertRowid };
            } else {
                return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
            }
        }

        // --- Hybrid Auto Check-out Logic ---
        const settings = db.prepare("SELECT key, value FROM SystemSetting WHERE companyId = ? AND key IN ('office_end_time', 'enable_auto_checkout')").all(session.companyId) as { key: string, value: string }[];
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => settingsMap[s.key] = s.value);

        const nowUtc = new Date();
        const nowJakarta = new Date(nowUtc.getTime() + (7 * 60 * 60 * 1000));
        const startOfDayJakarta = new Date(nowJakarta);
        startOfDayJakarta.setUTCHours(0, 0, 0, 0);
        const todayDate = new Date(startOfDayJakarta.getTime() - (7 * 60 * 60 * 1000));

        const enableAutoCheckout = settingsMap.enable_auto_checkout === 'true';
        if (enableAutoCheckout) {
            // Fetch all records without check-out
            const pendingAttendance = db.prepare('SELECT id, date FROM Attendance WHERE employeeId = ? AND checkOut IS NULL').all(employee.id) as any[];

            if (pendingAttendance.length > 0) {
                const officeEndTime = settingsMap.office_end_time || '17:00';
                const updateStmt = db.prepare('UPDATE Attendance SET checkOut = ?, checkOutType = ? WHERE id = ?');
                const [h, m] = officeEndTime.split(':').map(Number);

                pendingAttendance.forEach(record => {
                    // boundary = record.date (00:00 WIB) + officeEndTime
                    const boundaryUtc = new Date(record.date);
                    boundaryUtc.setUTCMinutes(boundaryUtc.getUTCMinutes() + (h * 60) + m);

                    // If current time (UTC) is past boundary (UTC), auto close
                    if (nowUtc > boundaryUtc) {
                        updateStmt.run(boundaryUtc.toISOString(), 'AUTO', record.id);
                    }
                });
            }
        }
        // -----------------------------------

        const isAdmin = session.role === 'ADMIN' || session.role === 'SUPERADMIN' || session.role === 'COMPANY_OWNER';
        const employeeIdsParam = url.searchParams.get('employeeIds');
        const rolesParam = url.searchParams.get('roles');
        const searchParam = url.searchParams.get('search');
        const allParam = url.searchParams.get('all') === 'true';

        let historyQuery = '';
        const params: any[] = [];

        if (isAdmin) {
            // Admins see everyone by default, or filtered by employeeIds, roles, and search
            historyQuery = `
                SELECT a.*, u.name as employeeName, u.role as employeeRole
                FROM Attendance a
                JOIN Employee e ON a.employeeId = e.id
                JOIN User u ON e.userId = u.id
                WHERE 1=1
            `;

            if (session.role !== 'SUPERADMIN') {
                // Owner and Admin are restricted to their company and cannot see Superadmin
                historyQuery += ` AND u.companyId = ? AND u.role != 'SUPERADMIN' `;
                params.push(session.companyId);
            }

            if (searchParam) {
                historyQuery += ` AND u.name LIKE ? `;
                params.push(`%${searchParam}%`);
            }

            if (employeeIdsParam) {
                const ids = employeeIdsParam.split(',').map(id => id.trim()).filter(id => id);
                if (ids.length > 0) {
                    const placeholders = ids.map(() => '?').join(',');
                    historyQuery += ` AND a.employeeId IN (${placeholders}) `;
                    params.push(...ids);
                }
            }

            if (rolesParam) {
                const roles = rolesParam.split(',').map(r => r.trim()).filter(r => r);
                if (roles.length > 0) {
                    const placeholders = roles.map(() => '?').join(',');
                    historyQuery += ` AND u.role IN (${placeholders}) `;
                    params.push(...roles);
                }
            }
        } else {
            // Employees only see their own
            historyQuery = `
                SELECT * FROM Attendance 
                WHERE employeeId = ? 
            `;
            params.push(employee.id);
        }

        if (startDate && endDate) {
            historyQuery += ` AND date BETWEEN ? AND ? `;
            // Expand end date to end of day
            const endD = new Date(endDate);
            endD.setHours(23, 59, 59, 999);
            params.push(startDate, endD.toISOString());
        }

        historyQuery += ` ORDER BY date DESC`;

        // If no filter and not requesting all, limit to reasonable amount (e.g. 30 days)
        if (!startDate && !employeeIdsParam && !rolesParam && !allParam) {
            historyQuery += ` LIMIT 30`;
        }

        const historyStmt = db.prepare(historyQuery);
        const history = historyStmt.all(...params);

        // todayDate is already defined as local midnight above

        const todayDateStmt = db.prepare(`
            SELECT * FROM Attendance 
            WHERE employeeId = ? AND date >= ? 
            LIMIT 1
        `);
        const todayDateAttendance = todayDateStmt.get(employee.id, todayDate.toISOString());

        return NextResponse.json({ history, todayDateAttendance });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.userId;

        const body = await request.json();
        const { latitude, longitude, address } = body;

        // Required Geolocation
        if (!latitude || !longitude) {
            return NextResponse.json({ error: 'Location permission is required to check in.' }, { status: 400 });
        }

        // --- Radius Validation ---
        const settings = db.prepare("SELECT key, value FROM SystemSetting WHERE companyId = ? AND key IN ('office_latitude', 'office_longitude', 'attendance_radius_meters', 'office_start_time', 'office_end_time', 'enable_auto_checkout')").all(session.companyId) as { key: string, value: string }[];
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => settingsMap[s.key] = s.value);

        const officeLat = parseFloat(settingsMap.office_latitude);
        const officeLng = parseFloat(settingsMap.office_longitude);
        const radiusLimit = parseInt(settingsMap.attendance_radius_meters || '0');

        if (officeLat && officeLng && radiusLimit > 0) {
            // Haversine Formula
            const R = 6371000; // Earth radius in meters
            const dLat = (latitude - officeLat) * Math.PI / 180;
            const dLon = (longitude - officeLng) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(officeLat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            if (distance > radiusLimit) {
                return NextResponse.json({
                    error: `Anda berada di luar radius absensi (${Math.round(distance)}m dari kantor, maksimal ${radiusLimit}m).`
                }, { status: 400 });
            }
        }
        // -------------------------

        const empStmt = db.prepare('SELECT id FROM Employee WHERE userId = ?');
        let employee = empStmt.get(userId) as any;

        if (!employee) {
            // Auto-create basic employee profile for Admins/Owners
            if (session.role === 'ADMIN' || session.role === 'SUPERADMIN' || session.role === 'COMPANY_OWNER') {
                const insertEmp = db.prepare('INSERT INTO Employee (userId, baseSalary, position, companyId) VALUES (?, ?, ?, ?)');
                const result = insertEmp.run(userId, 0, session.role, session.companyId);
                employee = { id: result.lastInsertRowid };
            } else {
                return NextResponse.json({ error: 'Not an employee' }, { status: 403 });
            }
        }

        const nowUtc = new Date();
        const nowJakarta = new Date(nowUtc.getTime() + (7 * 60 * 60 * 1000));
        const startOfDayJakarta = new Date(nowJakarta);
        startOfDayJakarta.setUTCHours(0, 0, 0, 0);
        const todayDate = new Date(startOfDayJakarta.getTime() - (7 * 60 * 60 * 1000));

        // --- Hybrid Auto Check-out Logic ---
        const enableAutoCheckout = settingsMap.enable_auto_checkout === 'true';
        if (enableAutoCheckout) {
            // Fetch all records without check-out
            const pendingAttendance = db.prepare('SELECT id, date FROM Attendance WHERE employeeId = ? AND checkOut IS NULL').all(employee.id) as any[];

            if (pendingAttendance.length > 0) {
                const officeEndTime = settingsMap.office_end_time || '17:00';
                const updateStmt = db.prepare('UPDATE Attendance SET checkOut = ?, checkOutType = ? WHERE id = ?');
                const [h, m] = officeEndTime.split(':').map(Number);

                pendingAttendance.forEach(record => {
                    // boundary = record.date (00:00 WIB) + officeEndTime
                    const boundaryUtc = new Date(record.date);
                    boundaryUtc.setUTCMinutes(boundaryUtc.getUTCMinutes() + (h * 60) + m);

                    // If current time (UTC) is past boundary (UTC), auto close
                    if (nowUtc > boundaryUtc) {
                        updateStmt.run(boundaryUtc.toISOString(), 'AUTO', record.id);
                    }
                });
            }
        }
        // -----------------------------------

        const checkStmt = db.prepare('SELECT id FROM Attendance WHERE employeeId = ? AND date >= ?');
        if (checkStmt.get(employee.id, todayDate.toISOString())) {
            return NextResponse.json({ error: 'Already checked in' }, { status: 400 });
        }

        const insert = db.prepare(`
            INSERT INTO Attendance (employeeId, date, checkIn, status, checkInStatus, latitude, longitude, address, companyId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // Dynamic Lateness Logic
        const startTimeSetting = settings.find(s => s.key === 'office_start_time')?.value || '09:00';
        const [targetHour, targetMinute] = startTimeSetting.split(':').map(Number);

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        let checkInStatus = 'ONTIME';
        if (currentHour > targetHour || (currentHour === targetHour && currentMinute > targetMinute)) {
            checkInStatus = 'LATE';
        }

        insert.run(employee.id, todayDate.toISOString(), now.toISOString(), 'PRESENT', checkInStatus, latitude, longitude, address || null, session.companyId);

        // Log Activity
        try {
            db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                .run(session.userId, 'CHECK_IN', `Melakukan Absen Masuk (Status: ${checkInStatus})`, session.companyId);
        } catch (e) { }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const userId = session.userId;

        const body = await request.json();
        const { id } = body;

        if (!id) return NextResponse.json({ error: 'Attendance ID required' }, { status: 400 });

        const now = new Date();
        const updateStmt = db.prepare('UPDATE Attendance SET checkOut = ?, checkOutType = ? WHERE id = ? AND checkOut IS NULL');
        const result = updateStmt.run(now.toISOString(), 'MANUAL', id);

        if (result.changes === 0) {
            return NextResponse.json({ error: 'Attendance record not found or already checked out' }, { status: 404 });
        }

        // Log Activity
        try {
            db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                .run(session.userId, 'CHECK_OUT_MANUAL', 'Melakukan Absen Pulang Manual', session.companyId);
        } catch (e) { }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
