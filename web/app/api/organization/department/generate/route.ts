import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { departmentsList } from "@/lib/data/departments";

const STANDARD_CODES = ['HR', 'FIN', 'IT', 'MKT', 'SALES', 'OPS', 'GA', 'L&D'];

export async function POST(request: Request) {
    try {
        const session = await getSession();
        // Strict Authorization: Only Superadmin can generate defaults for any company
        if (!session || session.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { companyId, type = 'STANDARD' } = await request.json();

        if (!companyId) {
            return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
        }

        // Determine which departments to create
        let targets = [];
        if (type === 'FULL') {
            targets = departmentsList;
        } else {
            // STANDARD default set
            targets = departmentsList.filter(d => STANDARD_CODES.includes(d.code || ''));
        }

        const results = {
            created: 0,
            skipped: 0,
            errors: 0
        };

        const insertDept = db.prepare("INSERT INTO Department (name, code, companyId) VALUES (?, ?, ?)");
        const checkDept = db.prepare("SELECT id FROM Department WHERE name = ? AND companyId = ?");

        // Default positions for every department
        const defaultPositions = [
            { title: 'Intern', level: 'Intern' },
            { title: 'Staff', level: 'Staff' },
            { title: 'Senior Staff', level: 'Senior Staff' },
            { title: 'Supervisor', level: 'Supervisor' },
            { title: 'Manager', level: 'Manager' },
            { title: 'head', level: 'Director' } // Adjusted 'Director' to 'Head' as generic title for department lead if preferred, or keep as Director. Keeping as 'Head' of Dept usually safe? Let's stick to previous code pattern: 'Director' might be too high. Let's use 'Manager' as highest or 'Head'. Code in single create used 'Director'. I'll stick to single create pattern to be consistent.
        ];
        // Re-checking single create pattern from previous view_file of app/api/departments/route.ts
        // It used: Intern, Staff, Senior Staff, Supervisor, Manager, Director.

        const insertPos = db.prepare("INSERT INTO Position (title, level, departmentId, companyId) VALUES (?, ?, ?, ?)");

        const transaction = db.transaction(() => {
            targets.forEach(dept => {
                try {
                    // Check duplicate
                    const existing = checkDept.get(dept.name, companyId);
                    if (existing) {
                        results.skipped++;
                        return; // Continue to next
                    }

                    const res = insertDept.run(dept.name, dept.code, companyId);
                    const newDeptId = res.lastInsertRowid;

                    // Create positions
                    defaultPositions.forEach(pos => {
                        insertPos.run(pos.title, pos.level, newDeptId, companyId);
                    });

                    results.created++;
                } catch (e) {
                    console.error(`Failed to create dept ${dept.name} for company ${companyId}`, e);
                    results.errors++;
                }
            });
        });

        transaction();

        return NextResponse.json({
            success: true,
            message: `Processed ${targets.length} departments`,
            stats: results
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
