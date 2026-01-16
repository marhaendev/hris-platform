import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { calculatePPh21, calculateBPJS } from '@/lib/utils/payroll/tax';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        let query = `
            SELECT p.*, u.name, d.name as departmentName, e.position
            FROM Payroll p
            JOIN Employee e ON p.employeeId = e.id
            JOIN User u ON e.userId = u.id
            LEFT JOIN Department d ON e.departmentId = d.id
            WHERE e.companyId = ?
        `;
        const params: any[] = [session.companyId];

        if (month && year) {
            const periodDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            query += ` AND p.period = ? `;
            params.push(periodDate.toISOString());
        }

        query += ` ORDER BY p.period DESC, u.name ASC `;

        const stmt = db.prepare(query);
        const payrolls = stmt.all(...params);

        // Transform
        const formatted = payrolls.map((p: any) => ({
            id: p.id,
            period: p.period,
            baseSalary: p.baseSalary,
            allowances: p.allowances,
            deductions: p.deductions,
            pph21: p.pph21,
            netSalary: p.netSalary,
            status: p.status,
            createdAt: p.createdAt,
            employee: {
                name: p.name,
                department: p.departmentName,
                position: p.position
            }
        }));

        return NextResponse.json(formatted);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Only Admin, Owner, Superadmin
        if (session.role === 'EMPLOYEE' || session.role === 'STAFF') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { month, year } = body;

        if (!month || !year) {
            return NextResponse.json({ error: 'Month and Year are required' }, { status: 400 });
        }

        const periodDate = new Date(year, month - 1, 1);
        const periodStr = periodDate.toISOString();

        // 1. Fetch Global Settings
        const rawSettings = db.prepare('SELECT key, value FROM PayrollSetting WHERE companyId = ?').all(session.companyId) as any[];
        const settings: any = {};
        rawSettings.forEach(s => {
            settings[s.key] = parseFloat(s.value);
        });

        // Get all employees for this company with their specific tax/bpjs settings
        const employees = db.prepare(`
            SELECT e.*, u.name 
            FROM Employee e
            JOIN User u ON e.userId = u.id
            WHERE e.companyId = ?
        `).all(session.companyId) as any[];

        const insertPayroll = db.prepare(`
            INSERT INTO Payroll (
                employeeId, period, baseSalary, allowances, 
                deductions, pph21, netSalary, totalSalary, status, companyId
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let count = 0;

        db.transaction(() => {
            for (const emp of employees) {
                // Check existing
                const existing = db.prepare('SELECT id, status FROM Payroll WHERE employeeId = ? AND period = ?')
                    .get(emp.id, periodStr) as any;

                if (existing && existing.status !== 'DRAFT') continue;

                // 2. Calculate Deductions (using dynamic settings)
                const bpjs = calculateBPJS(emp.baseSalary, settings);
                const totalDeductions = (emp.bpjsKesehatan ? bpjs.kesehatan : 0) +
                    (emp.bpjsKetenagakerjaan ? (bpjs.ketenagakerjaan + bpjs.pensiun) : 0);

                // 3. Calculate PPh21 (using dynamic settings)
                const pph21 = calculatePPh21(
                    emp.baseSalary, // Monthly Gross (assume no extra allowances for now)
                    emp.taxStatus || 'TK/0',
                    !!emp.npwp,
                    settings
                );

                // 4. Calculate Net
                const netSalary = emp.baseSalary - totalDeductions - pph21;

                if (existing) {
                    // Update existing DRAFT
                    db.prepare(`
                        UPDATE Payroll SET 
                            baseSalary = ?, allowances = ?, deductions = ?, 
                            pph21 = ?, netSalary = ?, totalSalary = ?
                        WHERE id = ?
                    `).run(emp.baseSalary, 0, totalDeductions, pph21, netSalary, netSalary, existing.id);
                } else {
                    // Insert New
                    insertPayroll.run(
                        emp.id,
                        periodStr,
                        emp.baseSalary,
                        0, // Allowances
                        totalDeductions,
                        pph21,
                        netSalary,
                        netSalary, // totalSalary
                        'DRAFT',
                        emp.companyId
                    );
                }
                count++;
            }
        })();

        return NextResponse.json({
            success: true,
            message: `Successfully generated ${count} payroll records.`
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
