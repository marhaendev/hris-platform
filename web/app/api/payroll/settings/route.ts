import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch Defaults (Metadata & Base Values)
        const defaults = db.prepare('SELECT * FROM PayrollSetting WHERE companyId = 1').all() as any[];

        // 2. Fetch Overrides for current company
        const overrides = db.prepare('SELECT * FROM PayrollSetting WHERE companyId = ?').all(session.companyId) as any[];
        const overridesMap = overrides.reduce((acc: any, curr: any) => {
            acc[curr.key] = { value: curr.value, isActive: curr.isActive };
            return acc;
        }, {});

        // 3. Merge
        const settings = defaults.map(s => ({
            ...s,
            value: overridesMap[s.key] !== undefined ? overridesMap[s.key].value : s.value,
            isActive: overridesMap[s.key] !== undefined ? overridesMap[s.key].isActive : (s.isActive ?? 1)
        }));

        const settingsObj = settings.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            acc[`${curr.key}_active`] = !!curr.isActive; // Add helper for active state
            return acc;
        }, {});

        return NextResponse.json({ settings, settingsObj });
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
        const { settings } = body; // Array of { key, value, isActive }

        if (!Array.isArray(settings)) {
            return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 });
        }

        const updateStmt = db.prepare('UPDATE PayrollSetting SET value = ?, isActive = ? WHERE key = ? AND companyId = ?');
        const insertStmt = db.prepare('INSERT INTO PayrollSetting (key, value, isActive, companyId, label, description) VALUES (?, ?, ?, ?, ?, ?)');

        db.transaction(() => {
            for (const s of settings) {
                const isActiveVal = s.isActive === undefined ? 1 : (s.isActive ? 1 : 0);
                const result = updateStmt.run(s.value, isActiveVal, s.key, session.companyId);
                if (result.changes === 0) {
                    // Fetch label and description from defaults to preserve UI metadata
                    const defaultInfo = db.prepare('SELECT label, description FROM PayrollSetting WHERE key = ? AND companyId = 1').get(s.key) as any;
                    insertStmt.run(
                        s.key,
                        s.value,
                        isActiveVal,
                        session.companyId,
                        defaultInfo?.label || s.key,
                        defaultInfo?.description || ''
                    );
                }
            }
        })();

        return NextResponse.json({ success: true, message: 'Pengaturan berhasil diperbarui' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
