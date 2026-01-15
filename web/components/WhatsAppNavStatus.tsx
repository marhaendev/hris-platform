'use client';

import { useState, useEffect } from 'react';
import { Smartphone, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from 'next/navigation';

export function WhatsAppNavStatus({ user }: { user: any }) {
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'connected' | 'not_linked' | 'disconnected'>('loading');

    useEffect(() => {
        if (!user || (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN' && user.role !== 'COMPANY_OWNER')) return;

        const checkStatus = async () => {
            try {
                const linkRes = await fetch('/api/settings/whatsapp');
                if (!linkRes.ok) return;
                const linkData = await linkRes.json();

                if (!linkData.sessionId) {
                    setStatus('not_linked');
                    return;
                }

                const botRes = await fetch(`/api/bot/sessions/${linkData.sessionId}?t=${Date.now()}`);
                if (!botRes.ok) {
                    setStatus('disconnected');
                    return;
                }
                const botData = await botRes.json();
                setStatus(botData.status === 'connected' ? 'connected' : 'disconnected');
            } catch (error) {
                setStatus('disconnected');
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000); // Polling as fallback

        // Real-time updates via SSE
        const eventSource = new EventSource('/api/notifications/stream');
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'WHATSAPP_STATUS_UPDATE') {
                    checkStatus();
                }
            } catch (err) { }
        };

        return () => {
            clearInterval(interval);
            eventSource.close();
        };
    }, [user]);

    if (status === 'loading') return null;
    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN' && user.role !== 'COMPANY_OWNER') return null;

    const getConfig = () => {
        switch (status) {
            case 'connected':
                return {
                    icon: CheckCircle2,
                    color: "text-emerald-500",
                    bg: "bg-emerald-500",
                    label: "WhatsApp Terhubung",
                    desc: "Layanan notifikasi aktif"
                };
            case 'not_linked':
                return {
                    icon: AlertTriangle,
                    color: "text-red-500",
                    bg: "bg-red-500",
                    label: "WhatsApp Belum Terhubung",
                    desc: "Klik untuk menghubungkan"
                };
            case 'disconnected':
            default:
                return {
                    icon: Smartphone,
                    color: "text-amber-500",
                    bg: "bg-amber-500",
                    label: "WhatsApp Terputus",
                    desc: "Klik untuk cek koneksi"
                };
        }
    };

    const config = getConfig();

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => router.push('/dashboard/settings/whatsapp')}
                        className={cn(
                            "relative h-9 w-9 rounded-xl flex items-center justify-center transition-all hover:bg-slate-50 group",
                            config.color
                        )}
                    >
                        <config.icon className="h-5 w-5" />
                        <span className={cn(
                            "absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full border-2 border-white animate-pulse",
                            config.bg
                        )} />
                    </button>
                </TooltipTrigger>
                <TooltipContent align="end" className="p-3 border-slate-200 shadow-xl rounded-xl">
                    <div className="flex flex-col gap-1">
                        <p className="text-xs font-black leading-none">{config.label}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{config.desc}</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
