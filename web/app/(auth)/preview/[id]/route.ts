import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import fs from 'fs';
import path from 'path';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session) return new NextResponse('Unauthorized', { status: 401 });

        const { id } = params;

        // Cari data pengajuan di DB
        const leave = db.prepare('SELECT attachment FROM LeaveRequest WHERE id = ?').get(id) as any;

        if (!leave || !leave.attachment) {
            return new NextResponse('Attachment not found', { status: 404 });
        }

        // Jalur file di sistem
        const filePath = path.join(process.cwd(), 'public', leave.attachment);

        if (!fs.existsSync(filePath)) {
            console.error(`[PDF Preview] File not found at: ${filePath}`);
            return new NextResponse('File physical not found', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();

        // Tentukan Content-Type
        let contentType = 'application/octet-stream';
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': 'inline',
            },
        });

    } catch (error: any) {
        console.error('[PREVIEW ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
