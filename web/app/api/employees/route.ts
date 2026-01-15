import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getSession } from '@/lib/session';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stmt = db.prepare(`
            SELECT e.*, u.name, u.email, u.username, u.phone, d.name as departmentName, p.title as positionTitle
            FROM Employee e 
            JOIN User u ON e.userId = u.id
            LEFT JOIN Department d ON e.departmentId = d.id
            LEFT JOIN Position p ON e.positionId = p.id
            WHERE e.companyId = ?
            AND u.role NOT IN('ADMIN', 'SUPERADMIN')
            ORDER BY e.id ASC
            `);
        const employees = stmt.all(session.companyId);

        const formatted = employees.map((emp: any) => ({
            id: emp.id,
            position: emp.positionTitle || emp.position,
            department: emp.departmentName || '-',
            baseSalary: emp.baseSalary,
            joinDate: emp.joinDate,
            user: {
                id: emp.userId,
                name: emp.name,
                email: emp.email,
                username: emp.username,
                phone: emp.phone
            },
            departmentId: emp.departmentId,
            positionId: emp.positionId
        }));
        return NextResponse.json(formatted);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, password, position, baseSalary, departmentId, positionId, phone } = body;

        // Validation: Name is mandatory. Phone & Email are optional.
        if (!name) {
            return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
        }

        const { validatePassword } = require('@/lib/auth');
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.isValid) {
            return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
        }


        if (email) {
            const checkStmt = db.prepare('SELECT id FROM User WHERE email = ?');
            if (checkStmt.get(email)) {
                return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
            }
        }

        // Check if phone/username already exists
        // Check if phone/username already exists
        // Auto-generate username from name or email if phone is not provided
        // If username exists, append random 4 digits
        let baseUsername = body.username || (phone ? phone.replace(/\D/g, '') : email?.split('@')[0] || name.toLowerCase().replace(/\s/g, '.'));
        // Clean username: remove specific chars if needed, keep it alphanumeric + dot/underscore
        baseUsername = baseUsername.replace(/[^a-zA-Z0-9._]/g, '').toLowerCase();

        let finalUsername = baseUsername;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            const checkUser = db.prepare('SELECT id FROM User WHERE username = ?');
            if (checkUser.get(finalUsername)) {
                // If taken, append random 4 digits to the BASE username
                const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
                finalUsername = `${baseUsername}${randomSuffix}`;
                attempts++;
            } else {
                isUnique = true;
            }
        }

        if (!isUnique) {
            return NextResponse.json({ error: 'Gagal membuat username unik, silakan coba lagi' }, { status: 400 });
        }

        const username = finalUsername;

        const hashedPassword = await hashPassword(password);

        const transaction = db.transaction(() => {
            const insertUser = db.prepare(`
                INSERT INTO User(name, email, password, role, companyId, createdAt, updatedAt, phone, username)
                VALUES(?, ?, ?, 'EMPLOYEE', ?, ?, ?, ?, ?)
                `);
            const now = new Date().toISOString();
            // Phone & Email can be null
            const userResult = insertUser.run(name, email || null, hashedPassword, session.companyId, now, now, phone || null, username);
            const userId = userResult.lastInsertRowid;

            const insertEmp = db.prepare(`
                INSERT INTO Employee(userId, position, baseSalary, departmentId, positionId, companyId)
                VALUES(?, ?, ?, ?, ?, ?)
                `);

            const dId = Number(departmentId) || null;
            const pId = Number(positionId) || null;

            insertEmp.run(userId, position || 'Staff', baseSalary || 0, dId, pId, session.companyId);
            return userId;
        });

        const userId = transaction();

        // Log Activity
        try {
            const insertLog = db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)');
            insertLog.run(userId, 'EMPLOYEE_CREATED', 'Akun karyawan berhasil dibuat', session.companyId);
        } catch (e) { console.error("Log Error", e); } // Don't fail request if log fails

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, name, departmentId, positionId, baseSalary, phone, email, username } = body;

        if (!id) return NextResponse.json({ error: "ID Required" }, { status: 400 });

        const transaction = db.transaction(() => {
            // Verify ownership via companyId and prevent ADMIN from editing SUPERADMIN
            let query = 'SELECT e.userId, u.role FROM Employee e JOIN User u ON e.userId = u.id WHERE e.id = ? AND e.companyId = ?';
            const emp = db.prepare(query).get(id, session.companyId) as any;

            if (!emp) throw new Error("Employee not found or unauthorized");
            if (session.role === 'ADMIN' && emp.role === 'SUPERADMIN') {
                throw new Error("Unauthorized: Admin cannot modify Superadmin data");
            }

            // Validate Username Uniqueness if changed
            if (username) {
                const current = db.prepare('SELECT username FROM User WHERE id = ?').get(emp.userId) as any;
                if (current.username !== username) {
                    const check = db.prepare('SELECT id FROM User WHERE username = ? AND id != ?').get(username, emp.userId);
                    if (check) throw new Error("Username sudah digunakan oleh pengguna lain");
                }
            }

            db.prepare('UPDATE User SET name = ?, email = ?, phone = ?, username = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
                .run(name, email || null, phone || null, username || null, emp.userId);

            const dId = Number(departmentId) || null;
            const pId = Number(positionId) || null;

            let posTitle = 'Staff';
            if (pId) {
                const pos = db.prepare('SELECT title FROM Position WHERE id = ?').get(pId) as any;
                if (pos) posTitle = pos.title;
            }

            db.prepare(`
                UPDATE Employee 
                SET departmentId = ?, positionId = ?, position = ?, baseSalary = ?
            WHERE id = ? AND companyId = ?
                `).run(dId, pId, posTitle, baseSalary || 0, id, session.companyId);

            return emp.userId;
        });

        const userId = transaction();

        // Log Activity
        try {
            const insertLog = db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)');
            insertLog.run(userId, 'EMPLOYEE_UPDATED', 'Data karyawan diperbarui', session.companyId);
        } catch (e) { console.error("Log Error", e); }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
