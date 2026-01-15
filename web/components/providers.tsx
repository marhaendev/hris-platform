'use client';

import { LanguageProvider } from '@/lib/contexts/LanguageContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            {children}
        </LanguageProvider>
    );
}
