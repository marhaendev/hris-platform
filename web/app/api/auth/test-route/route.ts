import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { comparePassword } from '@/lib/auth';
import { createSession } from '@/lib/session';
import fs from 'fs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // Log absolute DB Path for debugging
        const dbPathCheck = (db as any).name || 'unknown';
        fs.appendFileSync('login_debug.log', `[${new Date().toISOString()}] Login REQ: ${username}, CWD: ${process.cwd()}, DB: ${dbPathCheck}\n`);

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
        }

        // MAGIC LOGIN FOR ADMIN (Legacy/Dev)
        if (username === 'admin' && password === 'admin123') {
            console.log("Magic Admin Login detected");

            // Ensure Admin exists via DB seed logic
            let user = db.prepare('SELECT * FROM User WHERE username = ? OR email = ?').get('admin', 'admin@hris.local') as any;

            if (user) {
                console.log("Magic Login: Admin user found, creating session...");
                await createSession(user.id.toString(), user.companyId || 1, user.role || 'SUPERADMIN', user.name, user.email);
                return NextResponse.json({ success: true });
            } else {
                console.error("Magic Login: Admin user NOT found in database!");
            }
        }

        // Check Username (Primary) OR Email (Secondary/Legacy)
        const stmt = db.prepare('SELECT * FROM User WHERE username = ? OR email = ?');
        const user = stmt.get(username, username) as any;

        if (!user) {
            fs.appendFileSync('login_debug.log', `[${new Date().toISOString()}] Login failed: User '${username}' not found\n`);
            return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
        }

        const isPasswordMatch = await comparePassword(password, user.password);
        fs.appendFileSync('login_debug.log', `[${new Date().toISOString()}] User: ${user.username}, ID: ${user.id}, Match: ${isPasswordMatch}, SavedHash: ${user.password.substring(0, 10)}...\n`);

        if (!isPasswordMatch) {
            return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
        }

        console.log(`Login success for user: ${user.username}`);
        await createSession(user.id.toString(), user.companyId, user.role, user.name, user.email);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
