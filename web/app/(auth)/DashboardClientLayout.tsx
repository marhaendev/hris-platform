'use client';

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";


import { Sidebar } from "@/components/Sidebar";


import { DashboardTopNav } from "@/components/DashboardTopNav";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import React, { createContext, useContext } from "react";


const UserContext = createContext<any>(null);

export function useUser() {
    return useContext(UserContext);
}

export default function DashboardLayout({
    children,
    user
}: {
    children: React.ReactNode;
    user: any;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [companyRefreshKey, setCompanyRefreshKey] = useState(0);
    const router = useRouter();

    const refreshCompany = () => {
        setCompanyRefreshKey(prev => prev + 1);
    };


    // Auto-Logout Monitoring
    useEffect(() => {
        if (!user) return;

        const checkSession = async () => {
            try {
                const res = await fetch(`/api/auth/login?t=${Date.now()}&s=${Math.random()}`);

                if (res.status === 401 || res.status === 403) {
                    console.log("Session expired, redirecting to login...");
                    window.location.href = "/login?reason=expired";
                } else if (res.status !== 200) {
                    console.warn(`Session check returned unexpected status: ${res.status}`);
                }
            } catch (err) {
                console.error("Session check failed", err);
            }
        };

        const interval = setInterval(checkSession, 15000); // Check every 15s in production
        checkSession();
        return () => clearInterval(interval);
    }, [user, router]);

    return (
        <LanguageProvider>
            <UserContext.Provider value={{ ...user, refreshCompany }}>
                <div className="h-screen w-full relative flex flex-col md:flex-row overflow-hidden bg-gray-100">

                    {/* Global Top Nav */}
                    <DashboardTopNav
                        user={user}
                        isCollapsed={isCollapsed}
                        onMenuClick={() => setIsSidebarOpen(true)}
                        refreshKey={companyRefreshKey}
                    />


                    {/* Sidebar Desktop */}
                    <div className="hidden md:flex flex-col h-full z-[80] flex-shrink-0">
                        <Sidebar user={user} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                    </div>


                    {/* Mobile Sidebar Overlay */}
                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-[90] md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    {/* Mobile Sidebar */}
                    <div
                        className={`fixed top-0 left-0 h-full z-[100] md:hidden transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                            }`}
                    >
                        <Sidebar user={user} onClose={() => setIsSidebarOpen(false)} mode="mobile" />
                    </div>


                    {/* Content */}
                    <main className="flex-1 h-full overflow-y-auto pt-16">

                        {children}
                    </main>
                </div>
            </UserContext.Provider>
        </LanguageProvider>
    );
}
