import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { hashPassword } from '@/lib/auth';

const SUPERADMIN_ROLE = 'SUPERADMIN';

// Middleware to check session
async function getAuthenticatedSession() {
    const session = await getSession();
    if (!session) return null;
    return session;
}

export async function GET(request: Request) {
    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('q') || '';
        const id = searchParams.get('id');
        const all = searchParams.get('all') === 'true';

        // If not SUPERADMIN, we might want to hide the subscription_plan field
        const selectFields = session.role === SUPERADMIN_ROLE
            ? 'c.*'
            : 'c.id, c.name, c.address, c.logo_url, c.phone, c.whatsapp, c.email, c.website, c.about_config, c.createdAt, c.updatedAt';

        let query = `
            SELECT 
                ${selectFields},
                (SELECT name FROM User WHERE companyId = c.id AND role = 'COMPANY_OWNER' LIMIT 1) as ownerName,
                (SELECT email FROM User WHERE companyId = c.id AND role = 'COMPANY_OWNER' LIMIT 1) as ownerEmail,
                (SELECT COUNT(*) FROM Employee WHERE companyId = c.id) as employeeCount
            FROM Company c
        `;

        const params = [];

        // Check conditions in priority order
        // IF not SUPERADMIN AND NOT being impersonated (meaning original user is not SA)
        if (session.role !== SUPERADMIN_ROLE && !session.impersonatorId) {
            // Non-superadmin ALWAYS locked to their company
            query += " WHERE c.id = ?";
            params.push(session.companyId);
        }
        else if (id) {
            // Explicit ID takes priority for Superadmin
            query += " WHERE c.id = ?";
            params.push(id);
        } else if (search) {
            // Search filter
            query += " WHERE c.name LIKE ?";
            params.push(`%${search}%`);
        } else if (!all) {
            // DEFAULT for Superadmin: only current active company
            query += " WHERE c.id = ?";
            params.push(session.companyId);
        }
        // If 'all' is true and no other filters, return everything (no WHERE clause added)

        query += " ORDER BY c.createdAt DESC";

        const companies = db.prepare(query).all(...params);
        return NextResponse.json(companies);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getAuthenticatedSession();
    if (!session || session.role !== SUPERADMIN_ROLE) {
        return NextResponse.json({ error: 'Hanya Superadmin yang bisa menambah perusahaan' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { companyName, ownerName, ownerEmail, password, subscriptionPlan, address, phone, whatsapp, email, website } = body;

        // Validation
        if (!companyName || !ownerName || !ownerEmail || !password) {
            return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
        }

        // Check if email exists
        const userExists = db.prepare('SELECT id FROM User WHERE email = ?').get(ownerEmail);
        if (userExists) {
            return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);

        // Transaction
        const transaction = db.transaction(() => {
            // 1. Create Company
            const insertComp = db.prepare(`
                INSERT INTO Company (name, subscription_plan, address, phone, whatsapp, email, website) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            const compRes = insertComp.run(
                companyName,
                subscriptionPlan || 'FREE',
                address || null,
                phone || null,
                whatsapp || null,
                email || null,
                website || null
            );
            const companyId = compRes.lastInsertRowid;

            // 2. Create Owner
            const now = new Date().toISOString();
            const insertUser = db.prepare(`
                INSERT INTO User (name, email, username, password, role, companyId, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, 'COMPANY_OWNER', ?, ?, ?)
            `);
            const ownerResult = insertUser.run(ownerName, ownerEmail, ownerEmail, hashedPassword, companyId, now, now);

            // 3. Auto Create Admin (Requirement: admin@domain)
            try {
                const domain = ownerEmail.split('@')[1];
                if (domain) {
                    const adminEmail = `admin@${domain}`;
                    // Check if admin email already exists (edge case)
                    const adminExists = db.prepare('SELECT id FROM User WHERE email = ?').get(adminEmail);

                    if (!adminExists) {
                        const insertAdmin = db.prepare(`
                            INSERT INTO User (name, email, username, password, role, companyId, createdAt, updatedAt)
                            VALUES (?, ?, ?, ?, 'ADMIN', ?, ?, ?)
                        `);
                        // Admin uses same password as owner for initial setup
                        insertAdmin.run('Admin', adminEmail, adminEmail, hashedPassword, companyId, now, now);
                        console.log(`[Company API] Auto-created admin: ${adminEmail}`);
                    }
                }
            } catch (e: any) {
                console.error("Failed to auto-create admin", e);
            }

            // 4. Seed Default Settings for this Company
            try {
                const insertSettings = db.prepare(`
                    INSERT INTO SystemSetting (key, value, description, companyId) 
                    VALUES (?, ?, ?, ?)
                `);

                const defaultSettings = [
                    { key: 'jwt_expiration_hours', value: '1', desc: 'Masa berlaku session JWT dalam satuan jam' },
                    { key: 'otp_duration_minutes', value: '5', desc: 'Durasi masa berlaku kode OTP dalam menit' },
                    { key: 'jwt_expiration_minutes', value: '0', desc: 'Masa berlaku session JWT dalam satuan menit' }
                ];

                defaultSettings.forEach(s => {
                    insertSettings.run(s.key, s.value, s.desc, companyId);
                });
                console.log(`[Company API] Seeded default settings for company ${companyId}`);
            } catch (e: any) {
                console.error("Failed to seed company settings", e);
            }


            return companyId;
        });

        const newCompanyId = transaction();
        return NextResponse.json({ success: true, companyId: newCompanyId });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await getAuthenticatedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { id } = body;

        if (!id) return NextResponse.json({ error: 'ID Perusahaan diperlukan' }, { status: 400 });

        // RBAC: Non-superadmin can only update their own company
        if (session.role !== SUPERADMIN_ROLE && parseInt(id) !== session.companyId) {
            return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
        }

        // Build dynamic update query
        const updates: string[] = [];
        const params: any[] = [];
        const allowedFields = [
            'name', 'subscription_plan', 'address', 'phone',
            'whatsapp', 'email', 'website', 'about_config'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                // Only superadmin can change subscription plan
                if (field === 'subscription_plan' && session.role !== SUPERADMIN_ROLE) continue;

                updates.push(`${field} = ?`);
                params.push(body[field]);
            }
        }

        if (updates.length > 0) {
            updates.push('updatedAt = CURRENT_TIMESTAMP');
            const query = `UPDATE Company SET ${updates.join(', ')} WHERE id = ?`;
            params.push(id);
            db.prepare(query).run(...params);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getAuthenticatedSession();
    if (!session || session.role !== SUPERADMIN_ROLE) {
        return NextResponse.json({ error: 'Hanya Superadmin yang bisa menghapus perusahaan' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });

        // Manual cleanup to be safe
        const transaction = db.transaction(() => {
            db.prepare('DELETE FROM User WHERE companyId = ?').run(id);
            db.prepare('DELETE FROM Employee WHERE companyId = ?').run(id);
            db.prepare('DELETE FROM Department WHERE companyId = ?').run(id);
            db.prepare('DELETE FROM Position WHERE companyId = ?').run(id);
            db.prepare('DELETE FROM JobPosting WHERE companyId = ?').run(id);
            db.prepare('DELETE FROM Company WHERE id = ?').run(id);
        });

        transaction();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
