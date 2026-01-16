import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session;
    // Only Admin/Superadmin/Owner should upload system assets
    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') { // Add OWNER role check if defined in your RBAC, usually Admin is enough
        // Checking roles based on context. Assuming ADMIN/SUPERADMIN is enough for now. 
        // If "OWNER" is a specific role string, add it. Based on previous context, Owner users exist but might have role 'OWNER' or 'ADMIN'.
        // Let's safe check for 'OWNER' too if it exists in your role enum.
        if (user.role !== 'OWNER') {
            // Strict check: strictly standard roles
        }
    }

    // For now, let's stick to simple role check used in other files (ADMIN/SUPERADMIN) + OWNER if typically used
    // Actually, looking at previous files, 'OWNER' role definitely exists.
    if (!['SUPERADMIN', 'ADMIN', 'OWNER'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = 'logo-' + Date.now() + path.extname(file.name);

        // Define upload directory: inside public/logos
        const uploadDir = path.join(process.cwd(), 'public/logos');
        const filePath = path.join(uploadDir, filename);

        await writeFile(filePath, buffer);

        const fileUrl = `/logos/${filename}`;

        return NextResponse.json({ success: true, url: fileUrl });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
