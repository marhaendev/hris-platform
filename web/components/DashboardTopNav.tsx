'use client';

import { useState, useEffect } from "react";
import { Menu, Building2, ChevronDown, Check, ShieldAlert, LogOut, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { NavbarNotifications } from "@/components/NavbarNotifications";
import { WhatsAppNavStatus } from "@/components/WhatsAppNavStatus";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCompanyLogo } from "@/lib/hooks/useCompanyLogo";

interface DashboardTopNavProps {
    user?: any;
    isCollapsed?: boolean;
    onMenuClick: () => void;
    refreshKey?: number;
}

interface Company {
    id: number;
    name: string;
}

export function DashboardTopNav({ user, isCollapsed, onMenuClick, refreshKey }: DashboardTopNavProps) {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { companyLogo } = useCompanyLogo();

    const isSuperadmin = user?.role === 'SUPERADMIN' || user?.impersonatorId;

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await fetch('/api/organization/company?all=true', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();

                    // Add Global Option for Superadmin
                    let allCompanies = data;
                    if (isSuperadmin) {
                        const globalOption = { id: 0, name: 'GLOBAL (All Companies)' };
                        allCompanies = [globalOption, ...data];
                    }

                    setCompanies(allCompanies);

                    // Find current company from the list
                    // If user.companyId is 0 or null, it matches the Global Option
                    const currentId = user?.companyId || 0;
                    const found = allCompanies.find((c: Company) => c.id === currentId);

                    if (found) {
                        setCurrentCompany(found);
                    } else if (isSuperadmin && !user?.companyId) {
                        // Default to Global if valid superadmin but no specific company
                        setCurrentCompany(allCompanies[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch companies", err);
            }
        };

        if (user) {
            fetchCompanies();
        }
    }, [user, refreshKey, isSuperadmin]);

    const handleSwitchCompany = async (companyId: number) => {
        if (companyId === user?.companyId) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/switch-company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId })
            });

            if (res.ok) {
                // Reload to apply new session
                window.location.reload();
            } else {
                console.error("Failed to switch company");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStopImpersonation = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/impersonate/stop', { method: 'POST' });
            if (res.ok) {
                window.location.href = '/dashboard';
            } else {
                const data = await res.json();
                console.error(data.error || "Gagal menghentikan penyamaran");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn(
            "fixed top-0 right-0 z-40 shadow-sm transition-all duration-300",
            isCollapsed ? "md:left-20" : "md:left-64",
            "left-0",
            user?.impersonatorId ? "bg-slate-900 border-b border-slate-800 text-white" : "bg-white border-b border-slate-200 text-slate-700"
        )}>
            {/* Main Navbar Row */}
            <div className="h-16 px-4 flex items-center justify-between w-full">
                {/* Left side (Mobile only) */}
                <div className="flex items-center gap-2 md:hidden">
                    <Button variant="ghost" size="icon" onClick={onMenuClick} className="-ml-2">
                        <Menu className={cn("h-6 w-6", user?.impersonatorId ? "text-white" : "text-slate-700")} />
                    </Button>
                    <div className="relative h-8 w-28">
                        <Image
                            src={companyLogo}
                            alt="HRIS Logo"
                            fill
                            sizes="112px"
                            className={cn("object-contain object-left", user?.impersonatorId && "brightness-0 invert")}
                            priority
                            unoptimized
                        />
                    </div>
                </div>

                {/* Desktop Center/Left: Company Name & Switcher */}
                <div className="hidden md:flex items-center gap-4 ml-4 flex-1">
                    {isSuperadmin && !user?.impersonatorId ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={isLoading}>
                                <Button variant="ghost" className="flex items-center gap-2 px-3 py-1.5 h-auto hover:bg-slate-50 transition-all rounded-xl border border-transparent hover:border-slate-200 group">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                                    </div>
                                    <div className="text-left flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Perusahaan Aktif</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-bold text-slate-800 leading-tight">
                                                {isLoading ? 'Memproses...' : (currentCompany?.name || 'Memuat...')}
                                            </span>
                                            {!isLoading && <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-primary transition-colors" />}
                                        </div>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[280px] p-2 rounded-xl shadow-2xl border-slate-200">
                                <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Daftar Perusahaan Tenant
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="max-h-[300px] overflow-y-auto py-1 pr-1 custom-scrollbar">
                                    {companies.map((c) => (
                                        <DropdownMenuItem
                                            key={c.id}
                                            onClick={() => handleSwitchCompany(c.id)}
                                            disabled={isLoading}
                                            className={cn(
                                                "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer mb-1 last:mb-0 transition-all",
                                                c.id === user?.companyId
                                                    ? "bg-primary/5 text-primary"
                                                    : "hover:bg-slate-50 text-slate-600 hover:text-slate-900",
                                                isLoading && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold",
                                                    c.id === user?.companyId ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {c.id === 0 ? 'GL' : c.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-bold">{c.name}</span>
                                            </div>
                                            {c.id === user?.companyId && <Check className="h-4 w-4" />}
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl">
                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", user?.impersonatorId ? "bg-white/10 text-white" : "bg-primary/10 text-primary")}>
                                <Building2 className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className={cn("text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5", user?.impersonatorId ? "text-slate-400" : "text-slate-400")}>Perusahaan</span>
                                <span className={cn("text-sm font-bold leading-tight", user?.impersonatorId ? "text-white" : "text-slate-800")}>
                                    {currentCompany?.name || (isLoading ? 'Memuat...' : 'Mencari...')}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Simulation Indicator for Desktop */}
                    {user?.impersonatorId && (
                        <div className="ml-8 pl-8 border-l border-slate-800 flex items-center gap-6 animate-in fade-in slide-in-from-left duration-500">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Simulasi Aktif</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white">{user.name}</span>
                                    <span className="text-[10px] text-slate-500">asli: {user.impersonatorName}</span>
                                </div>
                            </div>
                            <Button
                                onClick={handleStopImpersonation}
                                disabled={isLoading}
                                variant="destructive"
                                size="sm"
                                className="h-8 text-[10px] font-black uppercase tracking-tight gap-2 shadow-lg"
                            >
                                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                                    <>
                                        <LogOut className="h-3 w-3" />
                                        Hentikan Simulasi
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right side (Notifications & Simulation for Mobile) */}
                <div className="flex items-center gap-3">
                    {user?.impersonatorId && (
                        <div className="md:hidden flex items-center mr-2">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                onClick={handleStopImpersonation}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <LogOut className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}
                    <WhatsAppNavStatus user={user} />
                    <NavbarNotifications />
                </div>
            </div>

            {/* Mobile Company Name Row */}
            {/* Mobile Company Name Row */}
            <div className="md:hidden w-full px-4 py-2 border-t border-slate-100 flex justify-center bg-slate-50/50">
                {isSuperadmin && !user?.impersonatorId ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={isLoading}>
                            <div className={cn(
                                "rounded-full px-3 py-0.5 max-w-[90%] border shadow-sm flex items-center gap-1 cursor-pointer transition-colors active:scale-95",
                                user?.impersonatorId
                                    ? "bg-slate-800 border-slate-700"
                                    : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                            )}>
                                <p className={cn(
                                    "text-[10px] font-bold truncate text-center",
                                    user?.impersonatorId ? "text-slate-300" : "text-slate-500"
                                )}>
                                    {currentCompany?.name || (isLoading ? '...' : (companies.length > 0 ? 'Pilih Perusahaan' : '...'))}
                                </p>
                                <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-[280px] p-2 rounded-xl shadow-2xl border-slate-200">
                            <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                                Pilih Perusahaan
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[300px] overflow-y-auto py-1 pr-1 custom-scrollbar">
                                {companies.map((c) => (
                                    <DropdownMenuItem
                                        key={c.id}
                                        onClick={() => handleSwitchCompany(c.id)}
                                        disabled={isLoading}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer mb-1 last:mb-0 transition-all",
                                            c.id === user?.companyId
                                                ? "bg-primary/5 text-primary"
                                                : "hover:bg-slate-50 text-slate-600 hover:text-slate-900",
                                            isLoading && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold",
                                                c.id === user?.companyId ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {c.id === 0 ? 'GL' : c.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold">{c.name}</span>
                                        </div>
                                        {c.id === user?.companyId && <Check className="h-4 w-4" />}
                                    </DropdownMenuItem>
                                ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className={cn(
                        "rounded-full px-3 py-0.5 max-w-[90%] border shadow-sm",
                        user?.impersonatorId
                            ? "bg-slate-800 border-slate-700"
                            : "bg-slate-50 border-slate-100"
                    )}>
                        <p className={cn(
                            "text-[10px] font-bold truncate text-center",
                            user?.impersonatorId ? "text-slate-300" : "text-slate-500"
                        )}>
                            {currentCompany?.name || '...'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

