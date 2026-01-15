import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession, createSession } from '@/lib/session';
import { hashPassword } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stmt = db.prepare(`
            SELECT u.id, u.name, u.email, u.phone, u.username, u.role, 
                   e.id as employeeId, e.annualLeaveQuota,
                   d.name as departmentName,
                   p.title as positionTitle
            FROM User u
            LEFT JOIN Employee e ON u.id = e.userId
            LEFT JOIN Department d ON e.departmentId = d.id
            LEFT JOIN Position p ON e.positionId = p.id
            WHERE u.id = ?
        `);
        const user = stmt.get(session.userId) as any;

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Add used quota calculation if employee exists
        if (user.employeeId) {
            const usedResult = db.prepare(`
                SELECT SUM(ABS(JulianDay(endDate) - JulianDay(startDate)) + 1) AS used 
                FROM LeaveRequest 
                WHERE employeeId = ? AND status = 'APPROVED' AND type = 'ANNUAL'
            `).get(user.employeeId) as any;

            user.usedLeaveQuota = usedResult?.used || 0;
            user.remainingLeaveQuota = (user.annualLeaveQuota || 12) - user.usedLeaveQuota;
        }

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, phone, username, password, confirmPassword, otp } = body;
        const userId = session.userId;

        if (!name || !email) {
            return NextResponse.json({ error: 'Nama dan Email wajib diisi' }, { status: 400 });
        }

        // Validate duplicates (excluding current user)
        // Check Email
        const checkEmail = db.prepare('SELECT id FROM User WHERE email = ? AND id != ?').get(email, userId);
        if (checkEmail) {
            return NextResponse.json({ error: 'Email sudah digunakan oleh pengguna lain' }, { status: 400 });
        }

        // Check Phone (if provided)
        if (phone) {
            // Get current phone to check if it changed
            const currentUser = db.prepare('SELECT phone FROM User WHERE id = ?').get(userId) as { phone: string };

            if (currentUser.phone !== phone) {
                // Phone is changing! Security Check.
                const checkPhone = db.prepare('SELECT id FROM User WHERE phone = ? AND id != ?').get(phone, userId);
                if (checkPhone) {
                    return NextResponse.json({ error: 'Nomor HP sudah digunakan oleh pengguna lain' }, { status: 400 });
                }

                // Check for OTP if phone is changing
                // If OTP is NOT provided in the request, we don't block yet (Client side handles the flow), 
                // BUT we must block the SAVE if it's strictly enforced.
                // However, the client needs to know WHEN to ask for OTP.
                // Let's assume the client sends 'otp' field if they have it.

                if (!body.otp) {
                    return NextResponse.json({
                        error: 'Verifikasi nomor HP diperlukan',
                        requiresOtp: true
                    }, { status: 403 }); // 403 Forbidden until OTP provided
                }

                // Verify OTP
                const validOtp = db.prepare(`
                    SELECT id FROM OTP 
                    WHERE identifier = ? AND code = ? AND expiresAt > datetime('now')
                `).get(phone, body.otp);

                if (!validOtp) {
                    return NextResponse.json({ error: 'Kode OTP salah atau kadaluarsa' }, { status: 400 });
                }

                // Consume OTP (Delete it)
                db.prepare('DELETE FROM OTP WHERE identifier = ?').run(phone);
            }
        }

        // Check Username (if provided)
        if (username) {
            // Specific validation: No spaces, alphanumeric + underscore/dot
            if (/\s/.test(username)) {
                return NextResponse.json({ error: 'Username tidak boleh mengandung spasi' }, { status: 400 });
            }
            if (username.length < 3) {
                return NextResponse.json({ error: 'Username minimal 3 karakter' }, { status: 400 });
            }

            const checkUsername = db.prepare('SELECT id FROM User WHERE username = ? AND id != ?').get(username, userId);
            if (checkUsername) {
                return NextResponse.json({ error: 'Username sudah digunakan oleh pengguna lain' }, { status: 400 });
            }
        }

        let updateStmt;
        if (password) {
            if (password.length < 6) {
                return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
            }
            if (password !== confirmPassword) {
                return NextResponse.json({ error: 'Konfirmasi password tidak cocok' }, { status: 400 });
            }

            const hashedPassword = await hashPassword(password);
            updateStmt = db.prepare(`
                UPDATE User 
                SET name = ?, email = ?, phone = ?, username = ?, password = ?, updatedAt = CURRENT_TIMESTAMP 
                WHERE id = ?
            `);
            updateStmt.run(name, email, phone || null, username || null, hashedPassword, userId);
        } else {
            updateStmt = db.prepare(`
                UPDATE User 
                SET name = ?, email = ?, phone = ?, username = ?, updatedAt = CURRENT_TIMESTAMP 
                WHERE id = ?
            `);
            updateStmt.run(name, email, phone || null, username || null, userId);
        }

        // Update Session Cookie immediately so visible changes (Sidebar) reflect instantly
        await createSession(
            userId,
            session.companyId,
            session.role,
            name, // New Name
            email, // New Email
            phone // New Phone
        );

        // Log Activity
        try {
            db.prepare('INSERT INTO ActivityLog (userId, action, description, companyId) VALUES (?, ?, ?, ?)')
                .run(userId, 'UPDATE_PROFILE', 'Pengguna memperbarui profil mereka', session.companyId);
        } catch (e) { }

        return NextResponse.json({ success: true, message: 'Profil berhasil diperbarui' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
