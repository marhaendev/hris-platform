'use client';

import { useState, useEffect } from 'react';
import {
    Bell, AlertTriangle, Smartphone, ExternalLink,
    CheckCircle2, Info, X, Megaphone, ShieldAlert
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface Notification {
    id: string;
    title: string;
    description: string;
    type: 'warning' | 'info' | 'success';
    href?: string;
    icon: any;
}

export function NavbarNotifications({ isCollapsed = false }: { isCollapsed?: boolean }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const user = useUser();
    const { t, locale } = useLanguage();

    useEffect(() => {
        if (!user) return;

        const checkSystemStatus = async () => {
            const staticNotifications: Notification[] = [];

            // 1. Check Phone Number (Local check)
            if (!user.phone) {
                staticNotifications.push({
                    id: 'missing-phone',
                    title: 'Lengkapi Nomor WhatsApp',
                    description: 'Penting untuk fitur Lupa Password dan Verifikasi OTP.',
                    type: 'warning',
                    href: '/dashboard/profile',
                    icon: Smartphone
                });
            }

            // Parallel fetch for speed with robust error catching
            const promises = [
                fetch(`/api/system/notifications?locale=${locale}`)
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null)
            ];

            if (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'COMPANY_OWNER') {
                promises.push(
                    fetch('/api/settings/whatsapp')
                        .then(async r => {
                            if (!r.ok) return null;
                            const linkData = await r.json();
                            if (!linkData.sessionId) return { status: 'not_linked' };

                            // Now check status of this specific session with cache-busting
                            const botRes = await fetch(`/api/bot/sessions/${linkData.sessionId}?t=${Date.now()}`);
                            if (!botRes.ok) return { status: 'disconnected', sessionId: linkData.sessionId };
                            const botData = await botRes.json();
                            return { status: botData.status, sessionId: linkData.sessionId };
                        })
                        .catch(() => null)
                );
            }

            try {
                const results = await Promise.all(promises);
                const dynamicData = results[0];
                const waStatusData = results[1] as any;

                const dynamicNotifs: Notification[] = dynamicData?.notifications?.map((n: any) => ({
                    id: `db-${n.id}`,
                    title: n.title,
                    description: n.message,
                    type: n.type,
                    href: n.href,
                    icon: n.category === 'system' || n.category === 'wa' ? ShieldAlert : Megaphone
                })) || [];

                const waNotifications: Notification[] = [];
                if (waStatusData) {
                    if (waStatusData.status === 'not_linked') {
                        waNotifications.push({
                            id: 'wa-integration',
                            title: 'WhatsApp Belum Terhubung',
                            description: 'Sistem tidak dapat mengirim notifikasi. Mohon hubungkan WA segera.',
                            type: 'warning',
                            href: '/dashboard/settings/whatsapp',
                            icon: AlertTriangle
                        });
                    } else if (waStatusData.status !== 'connected') {
                        waNotifications.push({
                            id: 'wa-disconnected',
                            title: 'WhatsApp Terputus',
                            description: 'Koneksi WhatsApp terputus. Mohon periksa kembali.',
                            type: 'warning',
                            href: '/dashboard/settings/whatsapp',
                            icon: Smartphone
                        });
                    }
                }

                setNotifications([...staticNotifications, ...waNotifications, ...dynamicNotifs]);
            } catch (err) {
                console.error('Critical error in checkSystemStatus', err);
                // Fallback to static notifications if everything fails
                setNotifications(staticNotifications);
            }
        };

        checkSystemStatus();
        const interval = setInterval(checkSystemStatus, 60000); // Polling as fallback, slower now

        // 4. Server-Sent Events for Real-time
        const eventSource = new EventSource('/api/notifications/stream');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'LEAVE_COUNT_UPDATE') {
                    // Refetch notifications immediately when someone applies for leave
                    checkSystemStatus();

                    // Show toast if user is admin
                    if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
                        toast.info(t.activity_settings.real_time.new_leave_toast, {
                            description: t.activity_settings.real_time.new_leave_desc,
                            duration: 5000,
                        });
                    }
                } else if (data.type === 'WHATSAPP_STATUS_UPDATE') {
                    // Refetch WhatsApp status in notifications
                    checkSystemStatus();
                }
            } catch (err) {
                console.error('Failed to parse SSE message', err);
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE Error:', err);
            eventSource.close();
        };

        return () => {
            clearInterval(interval);
            eventSource.close();
        };
    }, [user]);

    const hasNotifications = notifications.length > 0;

    const content = (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "relative h-9 w-9 rounded-xl transition-all",
                        hasNotifications ? "text-primary bg-primary/5 hover:bg-primary/10" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                >
                    <Bell className={cn("h-5 w-5", hasNotifications && "animate-pulse")} />
                    {hasNotifications && (
                        <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                            {notifications.length}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 border-slate-200 shadow-xl rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 leading-tight">{t.nav.notifications}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{t.notification_mgmt.subtitle}</p>
                    </div>
                    {hasNotifications && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-black">
                            {notifications.length} BARU
                        </Badge>
                    )}
                </div>

                <div className="max-h-[350px] overflow-y-auto py-2">
                    {notifications.length === 0 ? (
                        <div className="py-12 px-5 text-center">
                            <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-900">Semua Beres!</p>
                            <p className="text-xs text-slate-500 mt-1">Tidak ada peringatan sistem saat ini.</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <DropdownMenuItem
                                key={notif.id}
                                className="p-4 focus:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none group"
                                asChild
                            >
                                <Link
                                    href={notif.href || '#'}
                                    onClick={() => {
                                        setIsOpen(false);
                                        if (notif.id === 'db-pending-leave-count') {
                                            sessionStorage.setItem('filter_status_pending', 'true');
                                        }
                                    }}
                                >
                                    <div className="flex gap-4">
                                        <div className={cn(
                                            "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
                                            notif.type === 'warning' ? "bg-amber-50 text-amber-500 shadow-sm shadow-amber-100" : "bg-blue-50 text-blue-500 shadow-sm shadow-blue-100"
                                        )}>
                                            <notif.icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-black text-slate-900 leading-none">{notif.title}</p>
                                                {notif.type === 'warning' && (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-normal font-medium pr-2">
                                                {notif.description}
                                            </p>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-primary mt-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                                LIHAT DETAIL <ExternalLink className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>

                <div className="bg-slate-50/50 p-3 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-[10px] font-black text-slate-500 hover:text-slate-900 tracking-wider"
                        onClick={() => setIsOpen(false)}
                    >
                        TUTUP PANEL
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return content;
}
