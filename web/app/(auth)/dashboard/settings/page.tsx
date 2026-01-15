'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/settings/whatsapp');
    }, [router]);

    return (
        <div className="p-8 flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
}
