import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = session.role === 'ADMIN' || session.role === 'COMPANY_OWNER';
        const isSuperAdmin = session.role === 'SUPERADMIN';
        const isEmployee = session.role === 'EMPLOYEE' || session.role === 'STAFF';
        const companyId = session.companyId;

        // Helper to get Jakarta start of day specific date
        const getJakartaDate = (offsetDays = 0) => {
            const nowUtc = new Date();
            const nowJakarta = new Date(nowUtc.getTime() + (7 * 60 * 60 * 1000));
            nowJakarta.setDate(nowJakarta.getDate() - offsetDays);
            const startOfDayJakarta = new Date(nowJakarta);
            startOfDayJakarta.setUTCHours(0, 0, 0, 0);
            return new Date(startOfDayJakarta.getTime() - (7 * 60 * 60 * 1000)); // Back to UTC
        };

        const todayJakartaDate = getJakartaDate(0);
        const todayJakartaStr = todayJakartaDate.toISOString();

        const url = new URL(request.url);
        const rangeParam = url.searchParams.get('range') || 'week'; // week, month, year

        // Helper for Chart Generation
        const generateChartData = (entityId: number | string, isPersonal: boolean, companyIdForAdmin?: string) => {
            const nowUtc = new Date();
            const nowJakarta = new Date(nowUtc.getTime() + (7 * 60 * 60 * 1000));
            const currentYear = nowJakarta.getUTCFullYear();
            const currentMonth = nowJakarta.getUTCMonth();

            let data = [];

            if (rangeParam === 'year') {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                for (let m = 0; m < 12; m++) {
                    const startJakarta = new Date(Date.UTC(currentYear, m, 1));
                    const startStr = new Date(startJakarta.getTime() - (7 * 60 * 60 * 1000)).toISOString();
                    const endJakarta = new Date(Date.UTC(currentYear, m + 1, 1));
                    const endStr = new Date(endJakarta.getTime() - (7 * 60 * 60 * 1000)).toISOString();

                    let present = 0;
                    let late = 0;

                    if (isPersonal) {
                        present = (db.prepare("SELECT count(*) as count FROM Attendance WHERE employeeId = ? AND date >= ? AND date < ? AND status = 'PRESENT'").get(entityId, startStr, endStr) as any).count;
                        late = (db.prepare("SELECT count(*) as count FROM Attendance WHERE employeeId = ? AND date >= ? AND date < ? AND status = 'LATE'").get(entityId, startStr, endStr) as any).count;
                    } else {
                        let qBase = "SELECT count(DISTINCT employeeId) as count FROM Attendance a JOIN Employee e ON a.employeeId = e.id JOIN User u ON e.userId = u.id WHERE e.companyId = ? AND a.date >= ? AND a.date < ?";
                        if (isAdmin) qBase += " AND u.role != 'SUPERADMIN'";

                        present = (db.prepare(qBase + " AND a.status = 'PRESENT'").get(companyIdForAdmin, startStr, endStr) as any).count;
                        late = (db.prepare(qBase + " AND a.status = 'LATE'").get(companyIdForAdmin, startStr, endStr) as any).count;
                    }

                    data.push({ date: months[m], present, late });
                }
            } else if (rangeParam === 'month') {
                // Weekly Aggregation for All (M1-M5)
                const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                for (let w = 0; w < 5; w++) {
                    const startDay = (w * 7) + 1;
                    if (startDay > daysInMonth) break;

                    const startJakarta = new Date(Date.UTC(currentYear, currentMonth, startDay));
                    const startStr = new Date(startJakarta.getTime() - (7 * 60 * 60 * 1000)).toISOString();

                    let endJakarta = new Date(Date.UTC(currentYear, currentMonth, startDay + 7));
                    const nextMonthStart = new Date(Date.UTC(currentYear, currentMonth + 1, 1));
                    if (endJakarta > nextMonthStart) endJakarta = nextMonthStart;
                    const endStr = new Date(endJakarta.getTime() - (7 * 60 * 60 * 1000)).toISOString();

                    let present = 0;
                    let late = 0;

                    if (isPersonal) {
                        present = (db.prepare("SELECT count(*) as count FROM Attendance WHERE employeeId = ? AND date >= ? AND date < ? AND status = 'PRESENT'").get(entityId, startStr, endStr) as any).count;
                        late = (db.prepare("SELECT count(*) as count FROM Attendance WHERE employeeId = ? AND date >= ? AND date < ? AND status = 'LATE'").get(entityId, startStr, endStr) as any).count;
                    } else {
                        let qBase = "SELECT count(DISTINCT employeeId) as count FROM Attendance a JOIN Employee e ON a.employeeId = e.id JOIN User u ON e.userId = u.id WHERE e.companyId = ? AND a.date >= ? AND a.date < ?";
                        if (isAdmin) qBase += " AND u.role != 'SUPERADMIN'";

                        present = (db.prepare(qBase + " AND a.status = 'PRESENT'").get(companyIdForAdmin, startStr, endStr) as any).count;
                        late = (db.prepare(qBase + " AND a.status = 'LATE'").get(companyIdForAdmin, startStr, endStr) as any).count;
                    }

                    data.push({ date: `M${w + 1}`, present, late });
                }
            } else {
                // Week (Last 7 Days)
                for (let i = 6; i >= 0; i--) {
                    const targetDate = getJakartaDate(i);
                    const displayDate = new Date(targetDate.getTime() + (7 * 60 * 60 * 1000));

                    let present = 0;
                    let late = 0;

                    if (isPersonal) {
                        present = (db.prepare("SELECT count(*) as count FROM Attendance WHERE employeeId = ? AND date = ? AND status = 'PRESENT'").get(entityId, targetDate.toISOString()) as any).count;
                        late = (db.prepare("SELECT count(*) as count FROM Attendance WHERE employeeId = ? AND date = ? AND status = 'LATE'").get(entityId, targetDate.toISOString()) as any).count;
                    } else {
                        let qBase = "SELECT count(DISTINCT employeeId) as count FROM Attendance a JOIN Employee e ON a.employeeId = e.id JOIN User u ON e.userId = u.id WHERE e.companyId = ? AND a.date = ?";
                        if (isAdmin) qBase += " AND u.role != 'SUPERADMIN'";

                        present = (db.prepare(qBase + " AND a.status = 'PRESENT'").get(companyIdForAdmin, targetDate.toISOString()) as any).count;
                        late = (db.prepare(qBase + " AND a.status = 'LATE'").get(companyIdForAdmin, targetDate.toISOString()) as any).count;
                    }

                    data.push({
                        date: displayDate.toLocaleDateString('id-ID', { weekday: 'short' }),
                        present,
                        late
                    });
                }
            }
            return data;
        };

        if (isEmployee) {
            // 1. Personal Attendance (This Month)
            // Calculate start of month in Jakarta time
            const nowUtc = new Date();
            const nowJakarta = new Date(nowUtc.getTime() + (7 * 60 * 60 * 1000));
            const startOfMonthJakarta = new Date(Date.UTC(nowJakarta.getUTCFullYear(), nowJakarta.getUTCMonth(), 1));
            // Adjust back to UTC timestamp that represents 00:00 Jakarta on 1st of month
            const startOfMonthStr = new Date(startOfMonthJakarta.getTime() - (7 * 60 * 60 * 1000)).toISOString();

            // Get Employee ID first
            const emp = db.prepare('SELECT id, annualLeaveQuota, baseSalary FROM Employee WHERE userId = ?').get(session.userId) as any;
            if (!emp) return NextResponse.json({ error: "Employee record not found" }, { status: 404 });

            const attendanceCount = (db.prepare(`
                SELECT count(*) as count 
                FROM Attendance 
                WHERE employeeId = ? AND date >= ?
            `).get(emp.id, startOfMonthStr) as any).count;

            // 2. Leave Balance
            const usedQuotaResult = db.prepare(`
                SELECT SUM(ABS(JulianDay(endDate) - JulianDay(startDate)) + 1) AS used 
                FROM LeaveRequest 
                WHERE employeeId = ? AND status = 'APPROVED' AND type = 'ANNUAL'
            `).get(emp.id) as any;
            const usedQuota = usedQuotaResult?.used || 0;
            const leaveBalance = (emp.annualLeaveQuota || 12) - usedQuota;

            // 3. Today's Status
            const todayAtt = db.prepare('SELECT status, checkIn, checkOut FROM Attendance WHERE employeeId = ? AND date = ?').get(emp.id, todayJakartaStr) as any;
            let todayStatus = 'Belum Absen';
            if (todayAtt) {
                if (todayAtt.checkOut) todayStatus = 'Sudah Pulang';
                else todayStatus = todayAtt.status === 'LATE' ? 'Terlambat' : 'Hadir';
            }

            // 4. Lateness (This Month)
            let latenessCount = 0;
            try {
                const latenessResult = db.prepare(`
                    SELECT count(*) as total 
                    FROM Attendance 
                    WHERE employeeId = ? AND date >= ? AND status = 'LATE'
                `).get(emp.id, startOfMonthStr) as any;
                latenessCount = latenessResult?.total || 0;
            } catch (e) {
                console.error("Lateness query failed", e);
            }

            // 5. Personal Attendance Chart (Dynamic Range)
            const chartData = generateChartData(emp.id, true);

            return NextResponse.json({
                personalStats: {
                    attendanceCount,
                    leaveBalance,
                    todayStatus,
                    baseSalary: emp.baseSalary || 0
                },
                attendanceChart: chartData
            });
        }

        // 1. Total Employees
        let employeeQuery = 'SELECT count(*) as count FROM Employee e JOIN User u ON e.userId = u.id WHERE e.companyId = ?';
        if (isAdmin) employeeQuery += " AND u.role != 'SUPERADMIN'";
        const employeeCount = (db.prepare(employeeQuery).get(companyId) as any).count;

        // 2. Presence today
        // Use exact date string match for Jakarta "today"
        let onTimeQuery = `
            SELECT count(DISTINCT a.employeeId) as count 
            FROM Attendance a 
            JOIN Employee e ON a.employeeId = e.id
            JOIN User u ON e.userId = u.id
            WHERE e.companyId = ? AND a.date = ? AND a.status = 'PRESENT'
        `;
        if (isAdmin) onTimeQuery += " AND u.role != 'SUPERADMIN'";
        const onTimeCount = (db.prepare(onTimeQuery).get(companyId, todayJakartaStr) as any).count;

        let lateQuery = `
            SELECT count(DISTINCT a.employeeId) as count 
            FROM Attendance a 
            JOIN Employee e ON a.employeeId = e.id
            JOIN User u ON e.userId = u.id
            WHERE e.companyId = ? AND a.date = ? AND a.status = 'LATE'
        `;
        if (isAdmin) lateQuery += " AND u.role != 'SUPERADMIN'";
        const lateCount = (db.prepare(lateQuery).get(companyId, todayJakartaStr) as any).count;

        const absentCount = Math.max(0, employeeCount - (onTimeCount + lateCount));

        // 3. Departments & Positions Granular Stats
        const totalDepartments = (db.prepare('SELECT count(*) as count FROM Department WHERE companyId = ?').get(companyId) as any).count;
        const activeDepartments = (db.prepare('SELECT count(DISTINCT departmentId) as count FROM Employee WHERE companyId = ? AND departmentId IS NOT NULL').get(companyId) as any).count;
        const totalPositions = (db.prepare('SELECT count(*) as count FROM Position WHERE companyId = ?').get(companyId) as any).count;
        const activePositions = (db.prepare('SELECT count(DISTINCT positionId) as count FROM Employee WHERE companyId = ? AND positionId IS NOT NULL').get(companyId) as any).count;

        // 4. Payroll Estimate
        let payrollQuery = 'SELECT sum(e.baseSalary) as total FROM Employee e JOIN User u ON e.userId = u.id WHERE e.companyId = ?';
        if (isAdmin) payrollQuery += " AND u.role != 'SUPERADMIN'";
        const totalPayroll = (db.prepare(payrollQuery).get(companyId) as any).total || 0;

        // 5. Recent Employees
        let recentQuery = `
            SELECT e.id, u.name, p.title as position, e.joinDate
            FROM Employee e
            JOIN User u ON e.userId = u.id
            LEFT JOIN Position p ON e.positionId = p.id
            WHERE e.companyId = ?
        `;
        if (isAdmin) recentQuery += " AND u.role != 'SUPERADMIN'";
        recentQuery += " ORDER BY e.joinDate DESC LIMIT 5";
        const recentEmployees = db.prepare(recentQuery).all(companyId);

        // 6. Attendance Chart (Dynamic Range)
        const chartData = generateChartData(0, false, companyId);

        // 7. Leave Statistics (This Month)
        const startOfMonth = new Date(todayJakartaDate.getFullYear(), todayJakartaDate.getMonth(), 1).toISOString();
        const endOfMonth = new Date(todayJakartaDate.getFullYear(), todayJakartaDate.getMonth() + 1, 0).toISOString();

        let leaveQueryBase = "SELECT count(*) as count FROM LeaveRequest lr JOIN Employee e ON lr.employeeId = e.id JOIN User u ON e.userId = u.id WHERE e.companyId = ?";
        if (isAdmin) leaveQueryBase += " AND u.role != 'SUPERADMIN'";

        const pendingLeaves = (db.prepare(leaveQueryBase + " AND lr.status = 'PENDING'").get(companyId) as any).count;
        const approvedLeaves = (db.prepare(leaveQueryBase + " AND lr.status = 'APPROVED' AND lr.startDate >= ?").get(companyId, startOfMonth) as any).count; // Starts this month
        const rejectedLeaves = (db.prepare(leaveQueryBase + " AND lr.status = 'REJECTED' AND lr.updatedAt >= ?").get(companyId, startOfMonth) as any).count; // Rejected this month

        // 8. Employee Breakdown
        // Active can be considered all for now, or maybe check if resign date? Schema doesn't have resign date yet.
        // We'll use "New This Month"
        let newEmpQuery = "SELECT count(*) as count FROM Employee e JOIN User u ON e.userId = u.id WHERE e.companyId = ? AND e.joinDate >= ?";
        if (isAdmin) newEmpQuery += " AND u.role != 'SUPERADMIN'";
        const newEmployees = (db.prepare(newEmpQuery).get(companyId, startOfMonth) as any).count;

        // 9. Calendar Events (Current Month)
        // Fetch approved leaves
        let calendarQuery = `
            SELECT lr.startDate, lr.endDate, u.name, e.departmentId 
            FROM LeaveRequest lr
            JOIN Employee e ON lr.employeeId = e.id
            JOIN User u ON e.userId = u.id
            WHERE e.companyId = ? AND lr.status = 'APPROVED'
            AND (
                (lr.startDate BETWEEN ? AND ?) OR 
                (lr.endDate BETWEEN ? AND ?)
            )
        `;
        if (isAdmin) calendarQuery += " AND u.role != 'SUPERADMIN'";

        const rawEvents = db.prepare(calendarQuery).all(companyId, startOfMonth, endOfMonth, startOfMonth, endOfMonth);

        // Transform range to individual dates for easier frontend consumption (optional, or handle in frontend. 
        // Let's return raw ranges and let frontend handle expanding if needed, OR expand here for simple "has event" markers.)
        // Actually, simple list of events with start/end is standard for calendars.
        const calendarEvents = rawEvents.map((ev: any) => ({
            title: `Cuti: ${ev.name}`,
            start: ev.startDate,
            end: ev.endDate,
            type: 'leave'
        }));

        return NextResponse.json({
            totalEmployees: employeeCount,
            departments: {
                total: totalDepartments,
                active: activeDepartments
            },
            positions: {
                total: totalPositions,
                active: activePositions
            },
            presentToday: onTimeCount + lateCount,
            todayAttendance: {
                onTime: onTimeCount,
                late: lateCount,
                absent: absentCount,
                total: employeeCount
            },
            totalPayroll: totalPayroll,
            recentEmployees,
            attendanceChart: chartData,
            leaveStats: {
                pending: pendingLeaves,
                approved: approvedLeaves,
                rejected: rejectedLeaves
            },
            employeeStats: {
                total: employeeCount,
                newThisMonth: newEmployees
            },
            calendarEvents
        });
    } catch (error: any) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
