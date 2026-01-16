'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch and manage company logo from database
 * Returns the logo URL with cache buster for consistency across the app
 */
export function useCompanyLogo() {
    const [companyLogo, setCompanyLogo] = useState<string>('/icon.png');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const res = await fetch('/api/settings/company', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.company?.logo_url) {
                        // Use logo from database with cache buster
                        setCompanyLogo(`${data.company.logo_url}?v=${Date.now()}`);
                    } else {
                        // Fallback to default icon.png
                        setCompanyLogo(`/icon.png?v=${Date.now()}`);
                    }
                } else {
                    // Fallback on error
                    setCompanyLogo(`/icon.png?v=${Date.now()}`);
                }
            } catch (error) {
                console.error('Failed to fetch company logo:', error);
                // Fallback to default
                setCompanyLogo(`/icon.png?v=${Date.now()}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogo();
    }, []);

    return { companyLogo, isLoading };
}
