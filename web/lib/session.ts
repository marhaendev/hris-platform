import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import db from './db';
// import fs from 'fs';

// const logFile = 'session_debug.log';
function log(msg: string) {
    // try {
    //     fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
    // } catch (e) { }
    if (process.env.NODE_ENV === 'development') {
        console.log(`[SESSION] ${msg}`);
    }
}

const key = new TextEncoder().encode(process.env.JWT_SECRET || 'secret123');

export async function encrypt(payload: any, expirationMinutes: number = 1440) {
    log(`ENCRYPT: mins=${expirationMinutes}, payload_expires=${payload.expires}`);
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${expirationMinutes}m`)
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (e: any) {
        log(`DECRYPT ERROR: ${e.message}`);
        throw e;
    }
}

export async function createSession(
    userId: string,
    companyId?: number,
    role?: string,
    name?: string,
    email?: string,
    phone?: string,
    impersonatorId?: string,
    impersonatorName?: string
) {
    let totalMinutes = 60; // Default 1h
    try {
        // Try to fetch settings specific to this company
        let settings = db.prepare("SELECT key, value FROM SystemSetting WHERE key IN ('jwt_expiration_hours', 'jwt_expiration_minutes') AND companyId = ?").all(companyId || 1) as { key: string, value: string }[];

        // If empty, maybe fallback to companyId 1 or global defaults? 
        // For now, if empty, it will rely on default hrs=24, mins=0 below.

        let hrs = 1;
        let mins = 0;

        settings.forEach(s => {
            if (s.key === 'jwt_expiration_hours') hrs = parseInt(s.value) || 0;
            if (s.key === 'jwt_expiration_minutes') mins = parseInt(s.value) || 0;
        });

        totalMinutes = (hrs * 60) + mins;
        if (totalMinutes <= 0) totalMinutes = 60; // Guard against 0

        console.log(`SESSION DEBUG: Company=${companyId}, hrs=${hrs}, mins=${mins} => totalMinutes=${totalMinutes}`);
    } catch (e) {
        console.error("Failed to fetch jwt settings, fallback to 60m", e);
    }

    const expires = new Date(Date.now() + totalMinutes * 60 * 1000);
    console.log(`SESSION CREATE: userId=${userId}, duration=${totalMinutes}m, expiresAt=${expires.toLocaleTimeString()}`);
    const session = await encrypt({ userId, companyId, role, name, email, phone, expires, impersonatorId, impersonatorName }, totalMinutes);

    cookies().set('session', session, { expires, httpOnly: true, path: '/' });
}

export async function getSession() {
    const session = cookies().get('session')?.value;
    if (!session) {
        return null;
    }
    try {
        const payload = await decrypt(session);
        log(`GET_SESSION: Success for ${payload.userId}`);
        return payload;
    } catch (e: any) {
        log(`GET_SESSION: Expired or Invalid - ${e.message}`);
        return null;
    }
}

export async function logout() {
    cookies().set('session', '', { expires: new Date(0), path: '/', httpOnly: true });
}
