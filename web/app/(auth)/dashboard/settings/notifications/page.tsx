'use client';

import { useState, useEffect } from 'react';
import {
    Bell, Plus, Trash2, Edit2, Megaphone, ShieldAlert
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from "@/components/confirm-dialog";
import Link from 'next/link';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success';
    href?: string;
    targetRoles: string;
    category: string;
    isActive: number;
    createdAt: string;
}

export default function NotificationManagementPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const user = useUser();
    const { t } = useLanguage();

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/system/notifications?management=true');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            toast.error('Gagal mengambil data notifikasi');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleDelete = async (id: number) => {
        setSelectedId(id);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/system/notifications?id=${selectedId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Notifikasi dihapus');
                fetchNotifications();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Gagal menghapus');
            }
        } catch (error) {
            toast.error('Gagal menghapus');
        } finally {
            setIsDeleting(false);
            setIsDeleteConfirmOpen(false);
            setSelectedId(null);
        }
    };

    if (isLoading) return (
        <div className="p-8 flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
                        <Bell className="h-6 w-6 md:h-8 md:w-8 text-primary" /> {t.notification_mgmt.title}
                    </h2>
                    <p className="text-sm md:text-base text-slate-500 font-medium italic">{t.notification_mgmt.subtitle}</p>
                </div>
                <Button asChild className="w-full md:w-auto gap-2 rounded-xl font-bold shadow-lg shadow-primary/20">
                    <Link href="/dashboard/settings/notifications/new">
                        <Plus className="h-4 w-4" /> {t.notification_mgmt.add}
                    </Link>
                </Button>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-slate-100">
                                <TableHead className="w-full md:w-[300px] text-xs font-black text-slate-400 uppercase tracking-widest py-4 md:py-6 px-4 md:px-8">{t.notification_mgmt.table.header.content}</TableHead>
                                <TableHead className="hidden md:table-cell text-xs font-black text-slate-400 uppercase tracking-widest py-6">{t.notification_mgmt.table.header.category}</TableHead>
                                <TableHead className="hidden md:table-cell text-xs font-black text-slate-400 uppercase tracking-widest py-6">{t.notification_mgmt.table.header.target}</TableHead>
                                <TableHead className="hidden md:table-cell text-xs font-black text-slate-400 uppercase tracking-widest py-6">{t.notification_mgmt.table.header.status}</TableHead>
                                <TableHead className="text-right text-xs font-black text-slate-400 uppercase tracking-widest py-4 md:py-6 px-4 md:px-8">{t.notification_mgmt.table.header.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {notifications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="h-16 w-16 bg-slate-100 rounded-3xl flex items-center justify-center">
                                                <Bell className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-slate-900">{t.notification_mgmt.table.empty}</p>
                                                <p className="text-sm font-medium text-slate-400 italic mt-1">{t.notification_mgmt.table.emptyDesc}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                notifications.map((notif) => (
                                    <TableRow key={notif.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="py-4 px-4 md:py-6 md:px-8">
                                            <div className="flex gap-4">
                                                <div className={cn(
                                                    "h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                                                    notif.type === 'warning' ? "bg-amber-50 text-amber-500 shadow-sm shadow-amber-100" :
                                                        notif.type === 'success' ? "bg-emerald-50 text-emerald-500 shadow-sm shadow-emerald-100" :
                                                            "bg-blue-50 text-blue-500 shadow-sm shadow-blue-100"
                                                )}>
                                                    {notif.category === 'system' || notif.category === 'wa' ? <ShieldAlert className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
                                                </div>
                                                <div className="space-y-1 overflow-hidden flex-1">
                                                    <p className="font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">{notif.title}</p>
                                                    <p className="text-xs text-slate-500 line-clamp-2 italic font-medium">{notif.message}</p>

                                                    {/* Mobile Only Metadata */}
                                                    <div className="flex flex-wrap items-center gap-2 mt-2 md:hidden">
                                                        <Badge variant="outline" className={cn(
                                                            "rounded-lg px-2 text-[10px] font-black uppercase tracking-wider h-5",
                                                            notif.category === 'system' || notif.category === 'wa'
                                                                ? "bg-red-50 text-red-500 border-red-100"
                                                                : "bg-slate-100 text-slate-500 border-slate-200"
                                                        )}>
                                                            {notif.category}
                                                        </Badge>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={cn("h-1.5 w-1.5 rounded-full", notif.isActive ? "bg-emerald-500" : "bg-slate-300")} />
                                                            <span className={cn("text-[10px] font-bold", notif.isActive ? "text-emerald-600" : "text-slate-400")}>
                                                                {notif.isActive ? "Aktif" : "Nonaktif"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant="outline" className={cn(
                                                "rounded-lg px-2 text-[10px] font-black uppercase tracking-wider",
                                                notif.category === 'system' || notif.category === 'wa'
                                                    ? "bg-red-50 text-red-500 border-red-100"
                                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                            )}>
                                                {notif.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                {notif.targetRoles.split(',').map(r => (
                                                    <span key={r} className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{r.trim()}</span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-2 w-2 rounded-full", notif.isActive ? "bg-emerald-500" : "bg-slate-300")} />
                                                <span className={cn("text-xs font-bold", notif.isActive ? "text-emerald-600" : "text-slate-400")}>
                                                    {notif.isActive ? "Aktif" : "Nonaktif"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-4 md:px-8">
                                            <div className="flex items-center justify-end gap-1 md:gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                    className="h-8 w-8 md:h-9 md:w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <Link href={`/dashboard/settings/notifications/${notif.id}/edit`}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(notif.id)}
                                                    className="h-8 w-8 md:h-9 md:w-9 rounded-xl hover:bg-red-50 hover:text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ConfirmDialog
                open={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
                title="Hapus Notifikasi?"
                description="Notifikasi ini akan dihapus secara permanen dan tidak akan terlihat lagi oleh pengguna."
                confirmText="Ya, Hapus"
                onConfirm={confirmDelete}
                isLoading={isDeleting}
            />
        </div>
    );
}
