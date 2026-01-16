import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const positionId = searchParams.get('positionId');

        if (!positionId) {
            return NextResponse.json({ error: "Missing positionId" }, { status: 400 });
        }

        // Dedicated optimized query for Org Chart
        const employees = db.prepare(`
            SELECT 
                e.id,
                u.name as userName,
                u.username as userUsername,
                u.email as userEmail,
                p.title as positionTitle
            FROM Employee e
            JOIN Position p ON e.positionId = p.id
            LEFT JOIN User u ON e.userId = u.id
            WHERE e.positionId = ? AND p.companyId = ?
            ORDER BY u.name ASC
        `).all(positionId, session.companyId);

        // Simple format for fast transmission and easy frontend mapping
        const result = employees.map((emp: any) => ({
            id: emp.id,
            name: emp.userName || emp.userUsername || 'Unknown',
            email: emp.userEmail || '',
            title: emp.positionTitle || 'Staff'
        }));

        console.log(`📊 [Chart-Employees API] Position ${positionId}, Company ${session.companyId}: Found ${result.length} employees`);
        if (result.length > 0) {
            console.log(`📊 [Chart-Employees API] First employee:`, result[0]);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Chart Employee API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
