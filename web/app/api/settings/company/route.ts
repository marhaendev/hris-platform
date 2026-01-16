import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import fs from 'fs';
import path from 'path';

// GET: Fetch Company Details
export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session;
    const companyId = user.companyId || 1;

    try {
        let company = db.prepare('SELECT * FROM Company WHERE id = ?').get(companyId) as any;

        if (!company) {
            // Fallback: Get the first company available (handling dev drift)
            company = db.prepare('SELECT * FROM Company LIMIT 1').get() as any;
        }

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Validate if logo file exists in filesystem
        if (company.logo_url && company.logo_url !== '/icon.png') {
            try {
                const publicDir = path.join(process.cwd(), 'public');
                // Remove potential query params usually not present in DB but just in case
                const cleanPath = company.logo_url.split('?')[0];
                const filePath = path.join(publicDir, cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath);

                if (!fs.existsSync(filePath)) {
                    // File is missing (likely due to container rebuild without volume mapping)
                    // Fallback to default icon
                    company.logo_url = '/icon.png';
                }
            } catch (err) {
                console.error("Error checking logo file existence:", err);
                // Fallback on error
                company.logo_url = '/icon.png';
            }
        }

        return NextResponse.json({ company });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Update Company Details
export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session;
    if (!['SUPERADMIN', 'ADMIN', 'OWNER'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let companyId = user.companyId || 1;

    // Validate existence or fallback
    const existing = db.prepare('SELECT id FROM Company WHERE id = ?').get(companyId);
    if (!existing) {
        const first = db.prepare('SELECT id FROM Company LIMIT 1').get() as { id: number };
        if (first) companyId = first.id;
    }

    try {
        const body = await req.json();
        const { name, address, phone, email, website, logo_url } = body;

        // Custom File Handling Logic if logo_url is changing & is from /logos/
        if (logo_url && logo_url.startsWith('/logos/')) {
            const publicDir = path.join(process.cwd(), 'public');
            const iconPath = path.join(publicDir, 'icon.png');
            const newLogoPath = path.join(publicDir, logo_url);

            // 1. Backup current icon.png (if exists)
            if (fs.existsSync(iconPath)) {
                const timestamp = Date.now();
                const backupPath = path.join(publicDir, 'logos', `icon-backup-${timestamp}.png`);
                try {
                    fs.copyFileSync(iconPath, backupPath);
                } catch (err) {
                    console.error("Backup failed:", err);
                }
            }

            // 2. Copy new logo to icon.png
            if (fs.existsSync(newLogoPath)) {
                try {
                    fs.copyFileSync(newLogoPath, iconPath);
                } catch (err) {
                    console.error("Copy to icon.png failed:", err);
                    throw new Error("Failed to update system icon");
                }
            }
        }

        // We still save the logo_url as '/icon.png' with cache buster in DB?? 
        // OR we save the original upload path '/logos/xxx.png' but the system uses icon.png?
        // User said: "names it icon.png while previous icon.png copies to logos"
        // So the DB should probably point to '/icon.png' so the sidebar uses that standard URL. 
        // But if we do that, we lose the reference to the original source file. 
        // Let's stick to user request: "uploaded file becomes icon.png".
        // So effectively the active logo IS icon.png.
        // We can update DB to be '/icon.png?v=timestamp' to force frontend refresh.

        let finalLogoUrl = logo_url;
        if (logo_url && logo_url.startsWith('/logos/')) {
            finalLogoUrl = `/icon.png?v=${Date.now()}`;
        }

        const stmt = db.prepare(`
            UPDATE Company 
            SET name = ?, address = ?, phone = ?, email = ?, website = ?, logo_url = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        const result = stmt.run(
            name,
            address,
            phone,
            email,
            website,
            finalLogoUrl,
            companyId
        );

        if (result.changes === 0) {
            return NextResponse.json({ error: 'Update failed or Company not found' }, { status: 404 });
        }

        const updatedCompany = db.prepare('SELECT * FROM Company WHERE id = ?').get(companyId);

        return NextResponse.json({ success: true, company: updatedCompany });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
