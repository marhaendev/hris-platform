import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper function to run DB operation with retry for lock handling
function runWithRetry(fn: () => any, maxRetries = 3, delayMs = 100): any {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return fn();
        } catch (error: any) {
            if (error.message.includes('database is locked') && attempt < maxRetries) {
                console.log(`[Settings API] DB locked, retry ${attempt}/${maxRetries}...`);
                // Synchronous sleep for SQLite
                const start = Date.now();
                while (Date.now() - start < delayMs * attempt) { /* busy wait */ }
            } else {
                throw error;
            }
        }
    }
}

const ALLOWED_ROLES = ['SUPERADMIN', 'ADMIN', 'COMPANY_OWNER'];

export async function POST(request: Request) {
    try {
        const session = await getSession();
        // Only Admin, Superadmin, or Owner can change settings
        if (!session || !session.userId || !ALLOWED_ROLES.includes(session.role)) {
            console.log('[Settings API] Unauthorized attempt, role:', session?.role);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.companyId || 1;

        const body = await request.json();
        console.log('[Settings API] Received body:', body);
        const {
            otp_duration_minutes,
            jwt_expiration_hours,
            jwt_expiration_minutes,
            office_latitude,
            office_longitude,
            attendance_radius_meters,
            office_start_time,
            office_end_time,
            enable_auto_checkout,
            leave_annual_quota,
            leave_min_notice,
            otp_message_template
        } = body;

        // Use transaction to batch all updates and reduce lock time
        runWithRetry(() => {
            const updateSetting = db.transaction((settings: { key: string, value: string, desc: string }[]) => {
                const insert = db.prepare(`
                    INSERT INTO SystemSetting (key, value, description, companyId) 
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(key, companyId) DO UPDATE SET value = excluded.value
                `);
                for (const s of settings) {
                    insert.run(s.key, s.value, s.desc, companyId);
                    console.log(`[Settings API] Saved ${s.key} for Company ${companyId}:`, s.value);
                }
            });

            const settingsToUpdate: { key: string, value: string, desc: string }[] = [];

            if (otp_duration_minutes !== undefined) {
                settingsToUpdate.push({
                    key: 'otp_duration_minutes',
                    value: otp_duration_minutes.toString(),
                    desc: 'Durasi masa berlaku kode OTP dalam menit'
                });
            }

            if (otp_message_template !== undefined) {
                settingsToUpdate.push({
                    key: 'otp_message_template',
                    value: otp_message_template.toString(),
                    desc: 'Template pesan WhatsApp untuk kode OTP'
                });
            }

            if (jwt_expiration_hours !== undefined) {
                settingsToUpdate.push({
                    key: 'jwt_expiration_hours',
                    value: jwt_expiration_hours.toString(),
                    desc: 'Masa berlaku session JWT dalam satuan jam'
                });
            }

            if (jwt_expiration_minutes !== undefined) {
                settingsToUpdate.push({
                    key: 'jwt_expiration_minutes',
                    value: jwt_expiration_minutes.toString(),
                    desc: 'Masa berlaku session JWT dalam satuan menit'
                });
            }

            if (office_latitude !== undefined) {
                settingsToUpdate.push({
                    key: 'office_latitude',
                    value: office_latitude.toString(),
                    desc: 'Latitude lokasi kantor'
                });
            }

            if (office_longitude !== undefined) {
                settingsToUpdate.push({
                    key: 'office_longitude',
                    value: office_longitude.toString(),
                    desc: 'Longitude lokasi kantor'
                });
            }

            if (attendance_radius_meters !== undefined) {
                settingsToUpdate.push({
                    key: 'attendance_radius_meters',
                    value: attendance_radius_meters.toString(),
                    desc: 'Radius maksimal absensi dalam meter'
                });
            }

            if (office_start_time !== undefined) {
                settingsToUpdate.push({
                    key: 'office_start_time',
                    value: office_start_time.toString(),
                    desc: 'Batas waktu karyawan dianggap tidak terlambat'
                });
            }

            if (office_end_time !== undefined) {
                settingsToUpdate.push({
                    key: 'office_end_time',
                    value: office_end_time.toString(),
                    desc: 'Waktu standar pulang kantor'
                });
            }

            if (enable_auto_checkout !== undefined) {
                settingsToUpdate.push({
                    key: 'enable_auto_checkout',
                    value: enable_auto_checkout.toString(),
                    desc: 'Status aktivasi auto check-out'
                });
            }

            if (leave_annual_quota !== undefined) {
                settingsToUpdate.push({
                    key: 'leave_annual_quota',
                    value: leave_annual_quota.toString(),
                    desc: 'Kuota cuti tahunan standar karyawan'
                });
            }

            if (leave_min_notice !== undefined) {
                settingsToUpdate.push({
                    key: 'leave_min_notice',
                    value: leave_min_notice.toString(),
                    desc: 'Minimal hari pemberitahuan sebelum cuti'
                });
            }

            if (settingsToUpdate.length > 0) {
                updateSetting(settingsToUpdate);
            }
        });

        // Verify the saved values
        const savedSettings = db.prepare("SELECT key, value FROM SystemSetting WHERE companyId = ?").all(companyId);
        console.log('[Settings API] Verification - Current DB values:', savedSettings);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Settings API] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const companyId = session.companyId || 1;

        const settings = runWithRetry(() => {
            return db.prepare("SELECT key, value FROM SystemSetting WHERE companyId = ?").all(companyId) as { key: string, value: string }[];
        });

        // Transform array to object
        const settingsMap: Record<string, string> = {};
        settings.forEach((s: { key: string, value: string }) => settingsMap[s.key] = s.value);

        return NextResponse.json(settingsMap);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
