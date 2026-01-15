'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import { useRouter } from 'next/navigation';

// Define Menu Structure for the Matrix
const MENUS = [
    {
        category: "Overview",
        items: [
            { id: 'overview-dashboard', label: 'Dashboard' },
            { id: 'overview-analytics', label: 'Analytics' },
        ]
    },
    {
        category: "HR Management",
        items: [
            { id: 'hr-employees', label: 'Karyawan' },
            { id: 'hr-organization', label: 'Organisasi' },
            { id: 'hr-documents', label: 'Dokumen' },
            { id: 'hr-recruitment', label: 'Rekrutmen' },
        ]
    },
    {
        category: "Attendance",
        items: [
            { id: 'attendance-attendance', label: 'Kehadiran' },
            { id: 'attendance-shifts', label: 'Shift & Jadwal' },
        ]
    },
    {
        category: "Finance",
        items: [
            { id: 'finance-payroll', label: 'Payroll' },
        ]
    },
    {
        category: "System",
        items: [
            { id: 'system-whatsapp', label: 'Integrasi WA' },
            { id: 'system-settings', label: 'Settings' },
        ]
    }
];

const ROLES = ['ADMIN', 'HR', 'FINANCE', 'STAFF', 'EMPLOYEE'];

interface Permission {
    role: string;
    menu_id: string;
    can_view: number; // 0 or 1
}

export default function PermissionsPage() {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const user = useUser();
    const router = useRouter();

    useEffect(() => {
        if (user && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN' && user.role !== 'COMPANY_OWNER') {
            router.push('/dashboard');
            return;
        }
        fetchPermissions();
    }, [user, router]);

    const fetchPermissions = async () => {
        try {
            const res = await fetch('/api/settings/permissions');
            const data = await res.json();
            if (res.ok) {
                setPermissions(data.permissions);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Gagal mengambil data permission');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (role: string, menu_id: string, currentStatus: boolean) => {
        // Optimistic Update
        const newStatus = !currentStatus;

        // Update local state first
        setPermissions(prev => {
            const temp = [...prev];
            const idx = temp.findIndex(p => p.role === role && p.menu_id === menu_id);
            if (idx >= 0) {
                temp[idx] = { ...temp[idx], can_view: newStatus ? 1 : 0 };
            } else {
                temp.push({ role, menu_id, can_view: newStatus ? 1 : 0 });
            }
            return temp;
        });

        // Send to API
        try {
            const res = await fetch('/api/settings/permissions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role,
                    menu_id,
                    can_view: newStatus
                })
            });

            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error);
                // Revert if failed (simple reload for now or complex rollback)
                fetchPermissions();
            }
        } catch (error) {
            toast.error('Gagal menyimpan perubahan');
            fetchPermissions();
        }
    };

    const isChecked = (role: string, menu_id: string) => {
        const perm = permissions.find(p => p.role === role && p.menu_id === menu_id);
        // Default logic if not found: 
        // Admin gets everything by default if not seeded? But we seeded.
        return perm ? perm.can_view === 1 : false;
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight font-headline">Manajemen Akses Role</h1>
                    <p className="text-slate-500 mt-1 font-medium">Atur menu apa saja yang bisa diakses oleh setiap role karyawan.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/settings">
                        <Button variant="outline">Kembali ke Settings</Button>
                    </Link>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-slate-800">Matriks Permission</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-700 min-w-[200px]">Menu / Fitur</th>
                                {ROLES.map(role => (
                                    <th key={role} className="px-6 py-4 font-bold text-center border-l border-slate-100">
                                        <span className={`px-2 py-1 rounded text-[10px] ${role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                            role === 'HR' ? 'bg-pink-100 text-pink-700' :
                                                role === 'FINANCE' ? 'bg-green-100 text-green-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {role}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MENUS.map((group) => (
                                <>
                                    <tr key={group.category} className="bg-slate-50/30">
                                        <td colSpan={ROLES.length + 1} className="px-6 py-2 text-xs font-bold text-primary uppercase tracking-wider">
                                            {group.category}
                                        </td>
                                    </tr>
                                    {group.items.map((menu) => (
                                        <tr key={menu.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-slate-700 border-r border-slate-100">
                                                {menu.label}
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{menu.id}</div>
                                            </td>
                                            {ROLES.map(role => {
                                                const checked = isChecked(role, menu.id);
                                                // Admin always has access (disabled check)
                                                const disabled = role === 'ADMIN' || role === 'SUPERADMIN' || role === 'COMPANY_OWNER';

                                                return (
                                                    <td key={role} className="px-6 py-3 text-center border-r border-slate-100 last:border-0">
                                                        <div className="flex justify-center">
                                                            <Checkbox
                                                                checked={disabled ? true : checked}
                                                                disabled={disabled}
                                                                onCheckedChange={() => !disabled && handleToggle(role, menu.id, checked)}
                                                                className={disabled ? "opacity-50" : ""}
                                                            />
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-800 text-sm flex gap-3">
                <div className="shrink-0">ℹ️</div>
                <div>
                    <strong>Catatan:</strong> Perubahan permission akan berlaku real-time. User mungkin perlu refresh halaman untuk melihat perubahan menu. Role <strong>ADMIN</strong> memiliki akses penuh dan tidak bisa diubah.
                </div>
            </div>
        </div>
    );
}
