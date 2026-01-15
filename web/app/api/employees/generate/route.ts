import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getSession } from '@/lib/session';

const NAMES = [
    "Budi", "Siti", "Agus", "Wati", "Asep", "Sri", "Joko", "Dewi", "Eko", "Yanti",
    "Dedi", "Rina", "Iwan", "Ani", "Rudi", "Nur", "Tono", "Rini", "Hendra", "Dian",
    "Fajar", "Lestari", "Adi", "Putri", "Bayu", "Indah", "Reza", "Sari", "Rizki", "Ratna",
    "Dimas", "Ayu", "Fauzi", "Nisa", "Arif", "Mega", "Hadi", "Tia", "Gilang", "Vina",
    "Andi", "Lia", "Rangga", "Fitri", "Diki", "Wulan", "Satria", "Ria", "Bambang", "Nina"
];

const LAST_NAMES = [
    "Santoso", "Wijaya", "Saputra", "Hidayat", "Kusuma", "Pratama", "Nugroho", "Wibowo", "Setiawan", "Lestari",
    "Siregar", "Utama", "Purnomo", "Susanto", "Handayani", "Mulyadi", "Rahayu", "Firmansyah", "Yulianti", "Kurniawan",
    "Suryana", "Winata", "Aditya", "Pratiwi", "Gunawan", "Permana", "Hardiansyah", "Maulana", "Rosadi", "Suhendra",
    "Ramadhan", "Mustofa", "Irawan", "Saputri", "Nurhadi", "Anggraeni", "Wahyudi", "Kusnadi", "Hasanah", "Pradana",
    "Widodo", "Astuti", "Hermawan", "Cahyani", "Baskoro", "Damayanti", "Sanjaya", "Novita", "Wibisono", "Puspitasari"
];

const POSITIONS = [
    "Staff Administrasi", "Staff HRD", "Staff Finance", "Staff IT", "Staff Marketing",
    "Supervisor", "Manager", "Operator Produksi", "Security", "Driver", "Office Boy",
    "Accountant", "Sales Executive", "Programmer", "Designer"
];

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only allow SUPERADMIN or OWNER
        if (session.role !== 'SUPERADMIN' && session.role !== 'OWNER') {
            return NextResponse.json({ error: 'Permission Denied' }, { status: 403 });
        }

        const body = await request.json();
        // Determine max limit based on role
        const maxLimit = session.role === 'SUPERADMIN' ? 100000 : 500;
        const count = Math.min(Math.max(1, body.count || 5), maxLimit);

        // Get Available Departments & Positions from DB
        let depts = db.prepare('SELECT id, name FROM Department WHERE companyId = ?').all(session.companyId) as any[];
        let dbPositions = db.prepare('SELECT id, title FROM Position WHERE companyId = ?').all(session.companyId) as any[];

        // --- Auto-Seed Departments if empty ---
        if (depts.length === 0) {
            const seedDepts = ['Human Resources', 'Finance', 'IT', 'Marketing', 'Operations', 'Sales'];
            const insertDept = db.prepare('INSERT INTO Department (name, companyId) VALUES (?, ?)');
            seedDepts.forEach(dName => insertDept.run(dName, session.companyId));
            // Refresh
            depts = db.prepare('SELECT id, name FROM Department WHERE companyId = ?').all(session.companyId) as any[];
        }

        // --- Auto-Seed Positions if empty ---
        if (dbPositions.length === 0 && depts.length > 0) {
            const seedPositions = ['Manager', 'Staff', 'Supervisor', 'Intern'];
            const insertPos = db.prepare('INSERT INTO Position (title, departmentId, level, companyId) VALUES (?, ?, ?, ?)');

            // Generate positions for FIRST available department to ensure at least some exist.
            // Or generate for ALL departments. Let's do a few.
            depts.forEach(d => {
                seedPositions.forEach(pTitle => {
                    insertPos.run(`${pTitle} ${d.name}`, d.id, pTitle === 'Manager' ? 'Manager' : 'Staff', session.companyId);
                });
            });
            // Refresh
            dbPositions = db.prepare('SELECT id, title FROM Position WHERE companyId = ?').all(session.companyId) as any[];
        }

        const hashedPassword = await hashPassword('123456'); // Default password
        const now = new Date().toISOString();

        const transaction = db.transaction(() => {
            const results = [];

            // Prepare statements ONCE outside the loop for max performance
            const insertUser = db.prepare(`
                INSERT INTO User(name, email, password, role, companyId, createdAt, updatedAt, phone, username)
                VALUES(?, ?, ?, 'EMPLOYEE', ?, ?, ?, ?, ?)
            `);

            const insertEmp = db.prepare(`
                INSERT INTO Employee(userId, position, baseSalary, departmentId, positionId, companyId, annualLeaveQuota, joinDate)
                VALUES(?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const timestamp = Date.now();

            for (let i = 0; i < count; i++) {
                const firstName = getRandomItem(NAMES);
                const lastName = getRandomItem(LAST_NAMES);
                const fullName = `${firstName} ${lastName}`;

                // Guarantee uniqueness without DB query using timestamp + index
                // Format: budi.santoso.1700000000.1
                const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');
                const username = `${baseUsername}.${timestamp}.${i}`;
                const email = `${username}@example.com`;

                // Random Dept & Position
                let deptId = null;
                let posId = null;
                let posTitle = getRandomItem(POSITIONS); // Fallback

                if (depts.length > 0) {
                    const d = getRandomItem(depts);
                    deptId = d.id;
                }

                if (dbPositions.length > 0) {
                    const p = getRandomItem(dbPositions);
                    posId = p.id;
                    posTitle = p.title;
                }

                // Random Salary 4jt - 15jt
                const baseSalary = getRandomInt(4, 15) * 1000000;

                // Insert User
                const phone = `08${getRandomInt(1000000000, 9999999999)}`;
                const userResult = insertUser.run(fullName, email, hashedPassword, session.companyId, now, now, phone, username);
                const userId = userResult.lastInsertRowid;

                // Insert Employee
                insertEmp.run(userId, posTitle, baseSalary, deptId, posId, session.companyId, 12, now);
                results.push(userId);
            }
            return results;
        });

        const newIds = transaction();

        // Log Activity
        try {
            const insertLog = db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)');
            insertLog.run(session.id, 'DUMMY_GENERATED', `Generated ${count} dummy employees`, session.companyId);
        } catch (e) { }

        return NextResponse.json({ success: true, count: newIds.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
