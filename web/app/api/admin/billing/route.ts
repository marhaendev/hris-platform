import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session || session.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Mock Data for Billing Dashboard
    const stats = {
        mrr: 15500000,
        activeSubs: 12,
        unpaid: 3
    };

    const recentInvoices = [
        { id: 'INV-001', company: 'PT Teknologi Maju', amount: 1500000, status: 'PAID', date: '2025-12-01' },
        { id: 'INV-002', company: 'CV Berkah Abadi', amount: 500000, status: 'PAID', date: '2025-12-02' },
        { id: 'INV-003', company: 'Toko Baru', amount: 500000, status: 'PENDING', date: '2025-12-05' },
        { id: 'INV-004', company: 'Startup Keren', amount: 2500000, status: 'PAID', date: '2025-12-04' },
    ];

    return NextResponse.json({ stats, recentInvoices });
}
