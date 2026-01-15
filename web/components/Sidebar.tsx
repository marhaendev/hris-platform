"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    Banknote,
    LogOut,
    ShieldCheck,
    PieChart,
    Settings,
    FileText,
    Clock,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Menu,
    UserPlus,
    User,
    HelpCircle,
    Smartphone,
    Database,
    Bell,
    Building2,
    FlaskConical,
    ShieldAlert,
    Search,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner';
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/lib/contexts/LanguageContext";

// ... imports

interface MenuItem {
    id: string;
    name: string;
    icon?: any;
    href?: string;
    disabled?: boolean;
    subItems?: MenuItem[];
}

interface MenuGroup {
    title: string;
    id: string;
    items: MenuItem[];
}

// Let's keep static base and add dynamic check.
const menuItems: MenuItem[] = [
    { id: 'dashboard', name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, disabled: false },
    {
        id: 'organization',
        name: "Organisasi",
        icon: Building2,
        subItems: [
            { id: 'org-company', name: "Perusahaan", href: "/dashboard/organization/company" },
            { id: 'org-dept', name: "Departemen", href: "/dashboard/organization/departments" },
            { id: 'org-pos', name: "Posisi", href: "/dashboard/organization/positions" },
        ]
    },
    {
        id: 'users',
        name: "Users",
        icon: Users,
        subItems: [
            { id: 'users-owner', name: "Owner", href: "/dashboard/users/owner" },
            { id: 'users-admin', name: "Admin", href: "/dashboard/users/admin" },
            { id: 'users-employee', name: "Karyawan", href: "/dashboard/users/employees" },
        ]
    },
    {
        id: 'master-data',
        name: "Data Master",
        icon: Database,
        subItems: [
            { id: 'master-bank', name: "Bank", href: "/dashboard/admin/master-banks" },
            { id: 'master-payment', name: "Metode Bayar", href: "/dashboard/admin/master-payment-methods" },
        ]
    },
    {
        id: 'activity',
        name: "Aktivitas",
        icon: Clock,
        subItems: [
            { id: 'act-attendance', name: "Absensi", href: "/dashboard/activities/attendance" },
            { id: 'act-leave', name: "Cuti & Izin", href: "/dashboard/activities/leave" },
        ],
    },
    {
        id: 'finance',
        name: "Keuangan",
        icon: Banknote,
        subItems: [
            {
                id: 'finance-payroll',
                name: "Penggajian",
                subItems: [
                    { id: 'finance-salary', name: "Gaji Karyawan", href: "/dashboard/payroll/setting" },
                    { id: 'finance-dashboard', name: "Dashboard Gaji", href: "/dashboard/payroll" },
                ]
            },
        ],
    },
    {
        id: 'system',
        name: "Pengaturan",
        icon: Settings,
        subItems: [
            { id: 'sys-wa', name: "WhatsApp Bot", href: "/dashboard/settings/whatsapp" },
            { id: 'sys-notif', name: "Notifikasi", href: "/dashboard/settings/notifications" },
            { id: 'sys-act', name: "Aktivitas", href: "/dashboard/settings/activities" },
            { id: 'sys-auth', name: "Autentikasi", href: "/dashboard/settings/authentication" },
        ],
    },
    {
        id: 'playground',
        name: "Playground",
        icon: FlaskConical,
        href: "/dashboard/playground",
    },
    {
        id: 'about',
        name: "About",
        icon: HelpCircle,
        href: "/dashboard/about",
    },
];

export function Sidebar({
    onClose,
    user,
    mode = 'desktop',
    isCollapsed: propIsCollapsed,
    setIsCollapsed: propSetIsCollapsed
}: {
    onClose?: () => void,
    user?: any,
    mode?: 'mobile' | 'desktop',
    isCollapsed?: boolean,
    setIsCollapsed?: (v: boolean) => void
}) {

    const pathname = usePathname();
    const [localIsCollapsed, setLocalIsCollapsed] = useState(false);

    const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : localIsCollapsed;
    const setIsCollapsed = propSetIsCollapsed !== undefined ? propSetIsCollapsed : setLocalIsCollapsed;

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
    const [permissions, setPermissions] = useState<string[]>([]);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);
    const { t } = useLanguage();

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        main: true,
        "org-group": true,
        users: true,
        "master-group": true,
        activity: true,
        finance: true,
        system: true
    });
    const role = user?.role || 'GUEST';
    const [openFlyout, setOpenFlyout] = useState<string | null>(null);

    // Impersonation states
    const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [userSearch, setUserSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [isStartingSim, setIsStartingSim] = useState(false);

    const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);

    useEffect(() => {
        const fetchCompanies = async () => {
            setIsSearchingCompanies(true);
            try {
                const res = await fetch('/api/organization/company?all=true', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setCompanies(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Failed to fetch companies:", err);
            } finally {
                setIsSearchingCompanies(false);
            }
        };

        if (isImpersonateModalOpen && (role === 'SUPERADMIN' || user?.impersonatorId)) {
            fetchCompanies();
        }
    }, [isImpersonateModalOpen, role]);

    useEffect(() => {
        if (selectedCompanyId) {
            setIsSearchingUsers(true);
            const timer = setTimeout(() => {
                fetch(`/api/auth/impersonate/users?companyId=${selectedCompanyId}&q=${userSearch}`)
                    .then(res => res.json())
                    .then(data => {
                        setSearchResults(Array.isArray(data) ? data : []);
                        setIsSearchingUsers(false);
                    });
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [selectedCompanyId, userSearch]);

    const handleStartSimulation = async (targetUserId: number) => {
        setIsStartingSim(true);
        try {
            const res = await fetch('/api/auth/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId })
            });

            if (res.ok) {
                toast.success('Simulasi dimulai');
                window.location.href = '/dashboard';
            } else {
                const data = await res.json();
                toast.error(data.error || 'Gagal memulai simulasi');
            }
        } catch (err) {
            toast.error('Gagal menghubungi server');
        } finally {
            setIsStartingSim(false);
        }
    };

    // Fetch Permissions on Mount
    useEffect(() => {
        // Delay moved inside timeout to show skeleton for all roles
        const timer = setTimeout(() => {
            // Superadmin & Owner bypass permission fetch
            if (role === 'SUPERADMIN' || role === 'COMPANY_OWNER' || role === 'ADMIN') {
                setPermissionsLoaded(true);
                return;
            }

            const fetchPerms = async () => {
                try {
                    const res = await fetch('/api/settings/permissions');
                    if (res.ok) {
                        const data = await res.json();
                        // Filter only enabled permissions for my role
                        const myPerms = data.permissions
                            .filter((p: any) => p.role === role && p.can_view === 1)
                            .map((p: any) => p.menu_id);
                        setPermissions(myPerms);
                    }
                } catch (e) { console.error(e); }
                finally { setPermissionsLoaded(true); }
            };

            fetchPerms();
        }, 300); // 300ms delay to show skeleton

        return () => clearTimeout(timer);
    }, [role]);


    // Helper to translate menu names dynamically
    const getMenuName = (key: string) => {
        const map: { [k: string]: string } = {
            "Menu Utama": t.nav.main_menu,
            "Kehadiran": t.nav.activity,
            "Data Master": t.nav.master_data,
            "Users": t.nav.users,
            "Organisasi": t.nav.organization,
            "Keuangan": t.nav.finance,
            "Pengaturan": t.nav.system,
            "WhatsApp Bot": t.nav.whatsapp,
            "Website": t.nav.settings,

            "Dashboard": t.nav.dashboard,
            "About": t.nav.about,
            "Analytics": t.nav.analytics,
            "Admin": t.nav.admin,
            "Karyawan": t.nav.employees,
            "Dokumen": t.nav.documents,
            "Rekrutmen": t.nav.recruitment,
            "Lowongan": t.nav.jobs,
            "Pelamar": t.nav.applicants,
            "Absensi": t.nav.absensi,
            "Cuti & Izin": t.nav.leave,
            "Shift & Jadwal": t.nav.shifts,
            "Payroll": t.nav.payroll,
            "Penggajian": t.nav.payroll,
            "Penggajian Otomatis": t.nav.payroll_generator,
            "Gaji Karyawan": t.nav.salary_employee || "Gaji Karyawan",
            "Riwayat": t.nav.history,
            "Settings": t.nav.settings,
            "Integrasi WhatsApp": t.nav.whatsapp,
            "Notifikasi": t.nav.notifications,
            "Perusahaan": t.nav.companies,
            "Departemen": t.nav.master_departemen,
            "Posisi": t.nav.master_posisi,
            "Setting Global": t.nav.master_data,
            "Playground": t.nav.playground || "Playground",
        };
        return map[key] || key;
    };

    const toggleSubMenu = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenSubMenus(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Recursive helper to check visibility
    const isItemVisible = (item: MenuItem): boolean => {
        // Logic filter based on Role (simplified from original)
        // Adjust strictness as needed for your specific app logic
        if (item.id === 'master-data') return role === 'SUPERADMIN';
        if (item.id === 'organization') return role === 'SUPERADMIN' || role === 'ADMIN' || role === 'COMPANY_OWNER';
        if (item.id === 'finance') return role === 'SUPERADMIN' || role === 'ADMIN' || role === 'COMPANY_OWNER';
        if (item.id === 'system') return role === 'SUPERADMIN' || role === 'ADMIN' || role === 'COMPANY_OWNER';

        // Specific sub-item checks (preserved from original logic where possible)
        if (item.href === '/dashboard/users/owner') return role === 'SUPERADMIN';
        if (item.href === '/dashboard/users/admin') return role === 'SUPERADMIN' || role === 'COMPANY_OWNER';
        if (item.href === '/dashboard/users/employees') return role === 'SUPERADMIN' || role === 'ADMIN' || role === 'COMPANY_OWNER';
        if (item.href === '/dashboard/admin/companies') return role === 'SUPERADMIN';
        if (item.id === 'playground') return role === 'SUPERADMIN';

        return true;
    };

    const renderMenuItem = (item: MenuItem, depth: number = 0) => {
        if (!isItemVisible(item)) return null;

        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isSubOpen = openSubMenus[item.id];
        const isActive = pathname === item.href || (hasSubItems && item.subItems?.some(sub => pathname.startsWith(sub.href || 'XYZ'))); // XYZ to fail safe

        // Indentation for nested items
        const paddingLeft = depth > 0 ? `${(depth * 12) + 16}px` : '16px';

        if (!isCollapsed) {
            // EXPANDED MODE
            if (hasSubItems) {
                return (
                    <div key={item.id} className="space-y-1">
                        <button
                            onClick={(e) => toggleSubMenu(item.id, e)}
                            className={cn(
                                "flex items-center gap-3 rounded-lg py-2 text-xs font-medium transition-all w-full border-l border-transparent hover:border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-100 font-ui",
                                isActive ? "text-primary" : ""
                            )}
                            style={{ paddingLeft, paddingRight: '16px' }}
                        >
                            {depth === 0 && item.icon && <item.icon className="h-4 w-4 flex-shrink-0 text-slate-500" />}
                            <span suppressHydrationWarning className="flex-1 text-left">{getMenuName(item.name)}</span>
                            <ChevronDown className={cn("h-3 w-3 transition-transform", isSubOpen ? "rotate-0" : "-rotate-90")} />
                        </button>

                        <div className={cn("overflow-hidden transition-all duration-300 space-y-1", isSubOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                            {item.subItems!.map(sub => renderMenuItem(sub, depth + 1))}
                        </div>
                    </div>
                );
            } else {
                return (
                    <Link
                        key={item.id}
                        href={item.disabled ? "#" : (item.href || "#")}
                        onClick={() => onClose?.()}
                        className={cn(
                            "flex items-center gap-3 rounded-lg py-2 text-xs font-medium transition-all group overflow-hidden whitespace-nowrap border-l border-transparent hover:border-slate-200",
                            item.disabled ? "opacity-50 cursor-not-allowed text-slate-400" : "hover:bg-slate-100 text-slate-600 hover:text-primary",
                            pathname === item.href ? "bg-primary/10 text-primary border-l-primary" : "",
                            "font-ui"
                        )}
                        style={{ paddingLeft, paddingRight: '16px' }}
                    >
                        {depth === 0 && item.icon && <item.icon className={cn("h-4 w-4 transition-colors flex-shrink-0",
                            pathname === item.href ? "text-primary" : "text-slate-500 group-hover:text-primary"
                        )} />}
                        <span suppressHydrationWarning>{getMenuName(item.name)}</span>
                    </Link>
                );
            }
        } else {
            // COLLAPSED MODE (Only Root Level Rendering usually)
            // For nested items in collapsed mode, we usually use a dropdown.
            // Since this is a recursive function, we only want to render the ROOT items here.
            // Nested items should be inside the DropdownContent of the parent.
            if (depth > 0) return null; // Should not happen with current logic below

            if (hasSubItems) {
                return (
                    <DropdownMenu
                        key={item.id}
                        open={openFlyout === item.id}
                        onOpenChange={(open) => !open && setOpenFlyout(null)}
                    >
                        <DropdownMenuTrigger asChild>
                            <div
                                className="relative group px-1"
                                onMouseEnter={() => setOpenFlyout(item.id)}
                                onMouseLeave={() => setOpenFlyout(null)}
                            >
                                <div
                                    className={cn(
                                        "flex items-center justify-center rounded-lg py-2.5 text-sm font-medium transition-all cursor-pointer group relative",
                                        isActive ? "bg-primary/10 text-primary" : "hover:bg-slate-100 text-slate-600 hover:text-primary"
                                    )}
                                >
                                    {item.icon && <item.icon className={cn("h-5 w-5 transition-colors",
                                        isActive ? "text-primary" : "text-slate-500 group-hover:text-primary"
                                    )} />}
                                </div>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            side="right"
                            align="start"
                            sideOffset={12}
                            className="w-56 p-2 z-[100]"
                            onMouseEnter={() => setOpenFlyout(item.id)}
                            onMouseLeave={() => setOpenFlyout(null)}
                        >
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1.5 bg-slate-50/50 rounded-t-md">
                                {getMenuName(item.name)}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {/* Render SubItems Non-Recursively for Dropdown (simplified for 2-3 levels) */}
                            {item.subItems!.map(sub => renderDropdownItem(sub))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            } else {
                return (
                    <Tooltip key={item.id} delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Link
                                href={item.disabled ? "#" : (item.href || '#')}
                                className={cn(
                                    "flex items-center justify-center rounded-lg py-2.5 text-sm font-medium transition-all group relative mx-1",
                                    (item.disabled) ? "opacity-50 cursor-not-allowed text-slate-400" : "hover:bg-slate-100 text-slate-600 hover:text-primary",
                                    (pathname === item.href) ? "bg-primary/10 text-primary" : ""
                                )}
                            >
                                {item.icon && <item.icon className={cn("h-5 w-5 transition-colors",
                                    (pathname === item.href) ? "text-primary" : "text-slate-500 group-hover:text-primary"
                                )} />}
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-slate-900 text-white border-slate-800 font-semibold">
                            {getMenuName(item.name)}
                        </TooltipContent>
                    </Tooltip>
                );
            }
        }
    };

    // Helper for Flyout Nested Items (Collapsed Mode)
    // Supports 1 level of nesting in flyout for simplicity
    const renderDropdownItem = (item: MenuItem) => {
        if (!isItemVisible(item)) return null;

        if (item.subItems && item.subItems.length > 0) {
            return (
                <div key={item.id} className="px-2 py-1.5">
                    <div className="text-xs font-semibold text-slate-500 mb-1 px-2 uppercase">{getMenuName(item.name)}</div>
                    <div className="pl-2 border-l border-slate-100 space-y-0.5">
                        {item.subItems.map(sub => renderDropdownItem(sub))}
                    </div>
                </div>
            )
        }

        return (
            <DropdownMenuItem key={item.id} asChild>
                <Link
                    href={item.href || '#'}
                    className={cn(
                        "w-full cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition-all hover:bg-slate-50 text-slate-600 hover:text-primary",
                        pathname === item.href ? "bg-primary/5 text-primary font-bold" : ""
                    )}
                >
                    {getMenuName(item.name)}
                </Link>
            </DropdownMenuItem>
        );
    }

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (e) {
            console.error("Logout failed", e);
        } finally {
            window.location.href = "/login";
        }
    };


    const filteredItems = menuItems.map(item => {
        if (item.subItems) {
            const visibleSubItems = item.subItems.filter((sub: any) => {
                if (sub.href === '/dashboard/users/owner') return role === 'SUPERADMIN';
                if (sub.href === '/dashboard/users/admin') return role === 'SUPERADMIN' || role === 'COMPANY_OWNER';
                if (sub.href === '/dashboard/users/employees') return role === 'SUPERADMIN' || role === 'ADMIN' || role === 'COMPANY_OWNER';

                if (sub.href === '/dashboard/admin/companies') return role === 'SUPERADMIN';
                return true;
            });
            return { ...item, subItems: visibleSubItems };
        }
        return item;
    }).filter(item => {
        if (item.id === 'master-data') return role === 'SUPERADMIN';
        if (item.id === 'organization') return role === 'SUPERADMIN' || role === 'ADMIN' || role === 'COMPANY_OWNER';
        if (item.id === 'finance') return role === 'SUPERADMIN' || role === 'ADMIN' || role === 'COMPANY_OWNER';
        if (item.id === 'system') return role === 'SUPERADMIN' || role === 'ADMIN' || role === 'COMPANY_OWNER';
        if (item.id === 'playground') return role === 'SUPERADMIN';

        if (item.subItems && item.subItems.length === 0) return false;
        return true;
    });

    return (

        <TooltipProvider delayDuration={0}>
            <div
                className={cn(
                    "border-r bg-white text-slate-700 flex flex-col h-full transition-all duration-300 ease-in-out relative shadow-lg",
                    isCollapsed ? "md:w-20" : "md:w-64 w-64"
                )}
            >
                {/* Close Button - Mobile Only */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 z-50 md:hidden text-slate-500 hover:text-slate-900"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                )}



                {/* Header */}
                <div className={cn("flex h-16 items-center border-b border-slate-100 transition-all", isCollapsed ? "justify-center px-0" : "px-6 justify-between")}>
                    {!isCollapsed ? (
                        <>
                            <div className="relative h-10 w-32">
                                <Image
                                    src="/logo.png"
                                    alt="HRIS Logo"
                                    fill
                                    className="object-contain object-left"
                                    priority
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden md:flex h-8 w-8 text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors"
                                onClick={() => setIsCollapsed(true)}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center justify-center relative w-full">
                            <div className="relative h-8 w-8">
                                <Image
                                    src="/logo.png"
                                    alt="HRIS"
                                    fill
                                    className="object-contain object-center"
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden md:flex absolute right-0 translate-x-1/2 h-6 w-6 rounded-full border border-slate-200 bg-white text-slate-400 hover:text-primary hover:bg-slate-50 shadow-sm z-50 items-center justify-center p-0"
                                onClick={() => setIsCollapsed(false)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/20 hover:[&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {!permissionsLoaded ? (
                        // Skeleton Loading
                        <div className="space-y-2">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="animate-pulse">
                                    {!isCollapsed ? (
                                        <div className="flex items-center gap-3 rounded-lg px-4 py-2">
                                            <div className="h-4 w-4 bg-slate-200 rounded"></div>
                                            <div className="h-3 bg-slate-200 rounded flex-1"></div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center rounded-lg px-4 py-2">
                                            <div className="h-4 w-4 bg-slate-200 rounded"></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {menuItems.map(item => renderMenuItem(item))}
                        </>
                    )}
                </div>

                {/* Footer - User Menu */}
                <div className="border-t border-slate-100 p-4 relative">
                    <div className={cn("mb-4 flex items-center px-2", isCollapsed ? "justify-center" : "justify-between")}>
                        {!isCollapsed ? (
                            <>
                                <span suppressHydrationWarning className="text-xs font-bold text-slate-400 tracking-wider font-ui">Bahasa</span>
                                <LanguageSwitcher mode={mode} className="w-auto" size="small" isCollapsed={isCollapsed} />
                            </>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-full flex justify-center">
                                        <LanguageSwitcher mode={mode} className="w-auto" size="small" isCollapsed={isCollapsed} />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" suppressHydrationWarning>{t.common.changeLanguage || "Ganti Bahasa"}</TooltipContent>
                            </Tooltip>
                        )}
                    </div>

                    {!isCollapsed ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-xs font-bold text-primary uppercase">
                                    {user?.name?.slice(0, 2) || 'AD'}
                                </div>
                                <div className="text-xs flex-1 text-left overflow-hidden">
                                    <p suppressHydrationWarning className="font-medium text-slate-900 truncate">{user?.name || t.user.adminUser}</p>
                                    <p suppressHydrationWarning className="text-slate-500 truncate capitalize">{(user?.role || 'User').toLowerCase().replace(/_/g, ' ')}</p>
                                </div>
                                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", isUserMenuOpen && "rotate-180")} />
                            </button>

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">

                                    <Link
                                        href="/dashboard/profile"
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        <User className="h-4 w-4" />
                                        {t.user.profile}
                                    </Link>

                                    {(role === 'SUPERADMIN' || user?.impersonatorId) && (
                                        <button
                                            className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-primary hover:bg-primary/5 transition-colors border-t border-slate-100"
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                setIsImpersonateModalOpen(true);
                                            }}
                                        >
                                            <ShieldAlert className="h-4 w-4" />
                                            Simulasi User
                                        </button>
                                    )}

                                    <button
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            handleLogout();
                                        }}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        {t.user.logout}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="relative w-full flex justify-center"
                                >
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary hover:bg-primary/20 transition-colors uppercase">
                                        {user?.name?.slice(0, 2) || 'AD'}
                                    </div>
                                    {isUserMenuOpen && (
                                        <div className="absolute bottom-full left-full ml-2 mb-0 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden whitespace-nowrap z-50">

                                            <Link
                                                href="/dashboard/profile"
                                                className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsUserMenuOpen(false);
                                                }}
                                            >
                                                <User className="h-4 w-4" />
                                                {t.user.profile}
                                            </Link>

                                            {(role === 'SUPERADMIN' || user?.impersonatorId) && (
                                                <button
                                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-primary hover:bg-primary/5 transition-colors border-t border-slate-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsUserMenuOpen(false);
                                                        setIsImpersonateModalOpen(true);
                                                    }}
                                                >
                                                    <ShieldAlert className="h-4 w-4" />
                                                    Simulasi User
                                                </button>
                                            )}

                                            <button
                                                className="flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsUserMenuOpen(false);
                                                    handleLogout();
                                                }}
                                            >
                                                <LogOut className="h-4 w-4" />
                                                {t.user.logout}
                                            </button>
                                        </div>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">{user?.name || t.user.adminUser}</TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* Impersonation Modal */}
            <Dialog open={isImpersonateModalOpen} onOpenChange={setIsImpersonateModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-900 text-white border-b-0">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight">
                            <ShieldAlert className="h-5 w-5 text-amber-400" />
                            Simulasi User
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            Pilih perusahaan dan user untuk memulai simulasi sistem.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Langkah 1: Pilih Perusahaan</label>
                            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                                <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none border hover:border-primary/30">
                                    <SelectValue placeholder={isSearchingCompanies ? "Memuat..." : "-- Pilih Perusahaan --"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200">
                                    {companies.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                    {companies.length === 0 && !isSearchingCompanies && (
                                        <div className="p-2 text-center text-xs text-slate-400">Tidak ada perusahaan</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedCompanyId && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Langkah 2: Cari & Pilih User</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Nama atau Email..."
                                            className="pl-10 h-11 rounded-xl border-slate-200 focus:bg-white bg-slate-50/50"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="max-h-[220px] overflow-y-auto pr-1 custom-scrollbar space-y-1">
                                    {isSearchingUsers ? (
                                        <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                            <span className="text-[10px] font-black uppercase">Mencari User...</span>
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => handleStartSimulation(u.id)}
                                                disabled={isStartingSim}
                                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 group transition-all text-left border border-transparent hover:border-primary/10 relative overflow-hidden"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                                        {isStartingSim ? <Loader2 className="h-4 w-4 animate-spin text-primary group-hover:text-white" /> : u.name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700 group-hover:text-primary">{u.name}</span>
                                                        <span className="text-[10px] text-slate-400">{u.email}</span>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-[8px] h-5 bg-slate-50 group-hover:bg-primary/10 group-hover:text-primary transition-colors border-slate-200">
                                                    {u.role.replace(/_/g, ' ')}
                                                </Badge>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Tidak ada user ditemukan</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider >
    );
}
