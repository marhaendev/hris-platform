'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import { toast } from 'sonner';

export default function SettingsRedirect() {
    const router = useRouter();
    const user = useUser();

    useEffect(() => {
        if (user && !['SUPERADMIN', 'COMPANY_OWNER'].includes(user.role)) {
            router.push('/dashboard');
            toast.error("Akses Ditolak: Anda tidak memiliki izin");
            return;
        }
        router.replace('/dashboard/settings/whatsapp');
    }, [router, user]);

    if (!user || !['SUPERADMIN', 'COMPANY_OWNER'].includes(user.role)) {
        return null;
    }

    return (
        <div className="p-8 flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
}
