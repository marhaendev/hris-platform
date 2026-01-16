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

        // Get company owner email to extract domain
        console.log(`[GENERATE] Starting generation for companyId: ${session.companyId}`);

        let emailDomain = 'example.com'; // Fallback default
        try {
            // Try OWNER first, then ADMIN as fallback
            console.log(`[GENERATE] Querying OWNER for companyId: ${session.companyId}`);
            let owner = db.prepare('SELECT email FROM User WHERE companyId = ? AND role = \'OWNER\' LIMIT 1').get(session.companyId) as any;
            console.log(`[GENERATE] OWNER query result:`, owner);

            if (!owner || !owner.email) {
                // Fallback: try ADMIN
                console.log(`[GENERATE] No OWNER found, trying ADMIN for companyId: ${session.companyId}`);
                owner = db.prepare('SELECT email FROM User WHERE companyId = ? AND role = \'ADMIN\' LIMIT 1').get(session.companyId) as any;
                console.log(`[GENERATE] ADMIN query result:`, owner);
            }

            if (owner && owner.email) {
                console.log(`[GENERATE] Found user with email: ${owner.email}`);
                const domainMatch = owner.email.match(/@(.+)$/);
                console.log(`[GENERATE] Domain regex match:`, domainMatch);
                if (domainMatch) {
                    emailDomain = domainMatch[1];
                    console.log(`[GENERATE] ✅ Using email domain: ${emailDomain} from ${owner.email}`);
                }
            } else {
                console.log('[GENERATE] ❌ No OWNER or ADMIN found, using example.com');
            }
        } catch (e) {
            console.error('[GENERATE] ❌ Error fetching owner email:', e);
            // Use fallback domain
        }

        console.log(`[GENERATE] Final domain to use: ${emailDomain}`);

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

            for (let i = 0; i < count; i++) {
                const firstName = getRandomItem(NAMES);
                const lastName = getRandomItem(LAST_NAMES);
                const fullName = `${firstName} ${lastName}`;

                // Short, unique email format: firstname.lastname[counter]@domain
                const baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');

                // Add small counter for uniqueness (starts from 1 for first generation)
                const counter = i + 1;
                const username = counter === 1 ? baseEmail : `${baseEmail}${counter}`;
                const email = `${username}@${emailDomain}`;


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
