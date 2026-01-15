
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// LIST DOCUMENTS
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const docs = db.prepare('SELECT * FROM EmployeeDocument WHERE employeeId = ?').all(params.id);
        return NextResponse.json(docs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// UPLOAD DOCUMENT
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const type = formData.get('type') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        // Save file
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, ''); // Sanitize
        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);

        const fileUrl = `/uploads/${filename}`;

        // DB Insert
        const stmt = db.prepare(`
            INSERT INTO EmployeeDocument (employeeId, title, type, fileUrl)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(params.id, title, type, fileUrl);

        return NextResponse.json({ success: true, fileUrl });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
