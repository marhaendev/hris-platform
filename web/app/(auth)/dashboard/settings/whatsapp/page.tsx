'use client';

import { useState, useEffect } from 'react';
import { COUNTRY_CODES } from '@/lib/data/country-codes';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    Smartphone, RefreshCw, Send, CheckCircle2, ShieldCheck, QrCode, Globe,
    ArrowRight, AlertCircle, Copy, Terminal, Plus, Trash2, SmartphoneNfc, Timer, Save, Loader2,
    ChevronDown, ChevronRight, Settings2, Pencil, X, Eraser, UserCheck, ChevronsUpDown, Check
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select"
import { toast } from 'sonner';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface Session {
    id: string;
    status: 'connected' | 'disconnected' | 'scan_qr' | 'reconnecting' | 'starting';
    phone: string;
}

const DEFAULT_OTP_TEMPLATE = `*Kode Verifikasi HRIS Anda*\n\nKode OTP: *{{code}}*\n\nJangan berikan kode ini kepada siapapun (termasuk staf HRIS).`;

export default function WhatsAppPage() {
    const { t } = useLanguage();
    const user = useUser();
    const router = useRouter();

    // Core State
    const [linkedSessionId, setLinkedSessionId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [sharedBots, setSharedBots] = useState<any[]>([]);
    const [connectionType, setConnectionType] = useState<'private' | 'shared'>('private');

    // UI State
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isAddingSession, setIsAddingSession] = useState(false);
    const [newSessionQr, setNewSessionQr] = useState<string | null>(null);
    const [newSessionId, setNewSessionId] = useState<string | null>(null); // The temp 'new-...' ID
    const [isLinking, setIsLinking] = useState(false);

    // Settings & Testing
    const [settings, setSettings] = useState<any>({});
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isEditingOtp, setIsEditingOtp] = useState(false);

    const [countryCode, setCountryCode] = useState('62');
    const [openCountry, setOpenCountry] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState(t.whatsapp_mgmt.test.default_msg);
    const [isTestSending, setIsTestSending] = useState(false);
    const [isTestExpanded, setIsTestExpanded] = useState(true);

    // Logs (Superadmin Only)
    const [logs, setLogs] = useState<string[]>([]);
    const [isLogsExpanded, setIsLogsExpanded] = useState(false);

    // Dialogs
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // 1. Initial Load & Language Sync
    useEffect(() => {
        // Sync default message when language changes
        setTestMessage(t.whatsapp_mgmt.test.default_msg);

        if (user && !['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER'].includes(user.role)) {
            router.push('/dashboard');
            return;
        }

        const fetchData = async () => {
            try {
                // Get Linked Session
                const linkRes = await fetch('/api/settings/whatsapp');
                if (linkRes.ok) {
                    const linkData = await linkRes.json();
                    if (linkData.sessionId) {
                        setLinkedSessionId(linkData.sessionId);
                    }
                }

                // Get Shared Bots
                const sharedRes = await fetch('/api/settings/whatsapp/shared');
                if (sharedRes.ok) {
                    const sharedData = await sharedRes.json();
                    setSharedBots(sharedData);
                }

                // Get Settings
                const settingsRes = await fetch('/api/system/settings');
                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    setSettings(settingsData);
                }
            } catch (e) {
                console.error("Init Link Error", e);
            } finally {
                setIsPageLoading(false);
            }
        };

        fetchData();
    }, [user, router]);

    // 2. Polling Sessions & Logs
    useEffect(() => {
        const poll = async () => {
            try {
                // Fetch All Sessions (to find status of ours)
                const res = await fetch('/api/bot/sessions');
                const data = await res.json();
                if (data.sessions) {
                    setSessions(data.sessions);

                    // Logic to detect if our NEW session just got connected
                    if (newSessionId) {
                        const tempSession = data.sessions.find((s: Session) => s.id === newSessionId);

                        // Scenario A: Temp session exists and is connected -> Grab phone and link!
                        if (tempSession && tempSession.status === 'connected' && tempSession.phone) {
                            await handleLinkSession(tempSession.phone);
                        }
                    }
                }

                // Superadmin Logs
                if (user?.role === 'SUPERADMIN' && isLogsExpanded) {
                    const logRes = await fetch('/api/bot/logs');
                    const logData = await logRes.json();
                    if (logData.logs) setLogs(logData.logs);
                }
            } catch (e) { }
        };

        const interval = setInterval(poll, 2000);
        poll();
        return () => clearInterval(interval);
    }, [newSessionId, isLogsExpanded, user?.role]);

    // 3. Polling QR (Specific fast poll for QR image)
    useEffect(() => {
        if (!isAddingSession || !newSessionId) return;

        const checkQr = async () => {
            try {
                const res = await fetch(`/api/bot/sessions/${newSessionId}/qr`);
                if (res.status === 404) return;
                const data = await res.json();
                if (data.status === 'scan_qr' && data.qrImage) {
                    setNewSessionQr(data.qrImage);
                }
            } catch (e) { }
        };

        const interval = setInterval(checkQr, 1500);
        checkQr();
        return () => clearInterval(interval);
    }, [isAddingSession, newSessionId]);


    const handleLinkSession = async (phoneNumber: string) => {
        const cleanId = phoneNumber.replace('@s.whatsapp.net', '');
        try {
            await fetch('/api/settings/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: cleanId })
            });
            setLinkedSessionId(cleanId);
            setIsAddingSession(false);
            setNewSessionId(null);
            setNewSessionQr(null);
            toast.success(`WhatsApp Terhubung: ${cleanId}`);
        } catch (e) {
            toast.error("Gagal menyimpan sesi");
        }
    };

    const handleUseSharedBot = async (sessionId: string) => {
        setIsLinking(true);
        try {
            const res = await fetch('/api/settings/whatsapp/shared', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });
            if (res.ok) {
                setLinkedSessionId(sessionId);
                toast.success(`Berhasil menggunakan Bot Sistem: ${sessionId}`);
            } else {
                toast.error("Gagal menghubungkan bot sistem");
            }
        } catch (e) {
            toast.error("Gagal menghubungi server");
        } finally {
            setIsLinking(false);
        }
    };

    const handleAddSession = async () => {
        setIsAddingSession(true);
        setNewSessionQr(null);
        try {
            const res = await fetch('/api/bot/sessions/add', { method: 'POST' });
            if (!res.ok) throw new Error("Gagal");
            const data = await res.json();
            if (data.sessionId) {
                setNewSessionId(data.sessionId);
                if (data.qrImage) setNewSessionQr(data.qrImage);
            }
        } catch (e: any) {
            toast.error('Gagal membuat sesi baru: ' + (e.message || "Unknown error"));
            setIsAddingSession(false);
        }
    };

    const handleUnlinkSession = async () => {
        try {
            await fetch('/api/settings/whatsapp', { method: 'DELETE' });
            if (linkedSessionId) {
                // Only try to delete from bot if it was NOT a shared bot
                // (Quick check: is it in sharedBots?)
                const isShared = sharedBots.find(b => b.id === linkedSessionId);
                if (!isShared) {
                    try {
                        await fetch(`/api/bot/sessions/${encodeURIComponent(linkedSessionId)}`, { method: 'DELETE' });
                    } catch (e) { }
                }
            }
            setLinkedSessionId(null);
            toast.success("Sesi diputus");
        } catch (e) {
            toast.error("Gagal memutus sesi");
        }
        setDeleteConfirmOpen(false);
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            const res = await fetch('/api/system/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                toast.success('Pengaturan disimpan!');
                setIsEditingOtp(false);
            } else {
                toast.error('Gagal menyimpan');
            }
        } catch (err) {
            toast.error('Error');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleSendTest = async () => {
        if (!testPhone || !linkedSessionId) {
            toast.error('Isi nomor tujuan');
            return;
        }
        setIsTestSending(true);
        let phoneToSend = testPhone.trim();
        if (phoneToSend.startsWith('0')) phoneToSend = phoneToSend.slice(1);
        if (!phoneToSend.startsWith(countryCode)) phoneToSend = countryCode + phoneToSend;

        try {
            const res = await fetch('/api/bot/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phoneToSend,
                    message: testMessage,
                    sender: linkedSessionId
                })
            });
            if (res.ok) toast.success('Pesan terkirim!');
            else toast.error('Gagal mengirim pesan');
        } catch (err) {
            toast.error('Error connection');
        } finally {
            setIsTestSending(false);
        }
    };

    // Derived Logic
    const mySession = linkedSessionId
        ? sessions.find(s => s.id === linkedSessionId || s.phone === linkedSessionId)
        : null;

    const status = mySession ? mySession.status : (linkedSessionId ? 'offline' : 'none');
    const isUsingSharedBot = linkedSessionId && sharedBots.find(b => b.id === linkedSessionId);

    if (isPageLoading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t.whatsapp_mgmt.title}</h2>
                    <p className="text-slate-500">{t.whatsapp_mgmt.subtitle}</p>
                </div>
                {user?.role === 'SUPERADMIN' && (
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/settings/whatsapp/manage')} className="gap-2 border-primary text-primary hover:bg-primary/5">
                        <SmartphoneNfc className="h-4 w-4" /> {t.whatsapp_mgmt.manage_bot}
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-12">
                <div className="md:col-span-7 space-y-6">

                    {/* CONNECTION CARD */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-md font-bold flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-primary" />
                                {t.whatsapp_mgmt.connection_status}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {!linkedSessionId && !isAddingSession ? (
                                <div className="space-y-6">
                                    <div className="flex p-1 bg-slate-100 rounded-lg w-full max-w-sm mx-auto mb-6">
                                        <button
                                            onClick={() => setConnectionType('private')}
                                            className={cn(
                                                "flex-1 py-2 text-xs font-bold rounded-md transition-all",
                                                connectionType === 'private' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {t.whatsapp_mgmt.connect_type.private}
                                        </button>
                                        <button
                                            onClick={() => setConnectionType('shared')}
                                            className={cn(
                                                "flex-1 py-2 text-xs font-bold rounded-md transition-all",
                                                connectionType === 'shared' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {t.whatsapp_mgmt.connect_type.shared}
                                        </button>
                                    </div>

                                    {connectionType === 'private' ? (
                                        <div className="text-center py-6">
                                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <SmartphoneNfc className="h-8 w-8 text-slate-400" />
                                            </div>
                                            <h3 className="font-semibold text-slate-900 mb-2">{t.whatsapp_mgmt.not_connected}</h3>
                                            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                                                {t.whatsapp_mgmt.connect_desc}
                                            </p>
                                            <Button onClick={handleAddSession} className="gap-2">
                                                <Plus className="h-4 w-4" /> {t.whatsapp_mgmt.connect_btn}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="text-center mb-4">
                                                <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Globe className="h-8 w-8 text-emerald-500" />
                                                </div>
                                                <h3 className="font-semibold text-slate-900">{t.whatsapp_mgmt.shared.available}</h3>
                                                <p className="text-xs text-slate-500">{t.whatsapp_mgmt.shared.desc}</p>
                                            </div>

                                            <div className="grid gap-3">
                                                {sharedBots.length === 0 && (
                                                    <p className="text-center text-xs text-slate-400 italic py-4">{t.whatsapp_mgmt.shared.empty}</p>
                                                )}
                                                {sharedBots.map((bot) => (
                                                    <div key={bot.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "h-10 w-10 rounded-full flex items-center justify-center",
                                                                bot.status === 'connected' ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"
                                                            )}>
                                                                <Smartphone className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-900">{bot.name}</div>
                                                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                                    <Badge variant="outline" className="h-4 text-[9px] px-1 py-0">{bot.status.toUpperCase()}</Badge>
                                                                    <span>+{bot.phone}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs font-bold gap-2"
                                                            disabled={bot.status !== 'connected' || isLinking}
                                                            onClick={() => handleUseSharedBot(bot.id)}
                                                        >
                                                            {isLinking ? <Loader2 className="h-3 w-3 animate-spin" /> : t.whatsapp_mgmt.shared.select}
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : isAddingSession ? (
                                <div className="flex flex-col items-center">
                                    <h3 className="font-bold text-slate-900 mb-4 animate-pulse">{t.whatsapp_mgmt.scan_qr}</h3>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 mb-4 bg-white relative">
                                        {newSessionQr ? (
                                            <img src={newSessionQr} className="w-48 h-48 rounded" alt="QR" />
                                        ) : (
                                            <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-[scan_2s_ease-in-out_infinite]"></div>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
                                        {t.whatsapp_mgmt.scan_instruction}
                                    </p>
                                    <Button variant="ghost" onClick={() => setIsAddingSession(false)}>
                                        {t.common.cancel}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center 
                                            ${status === 'connected' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                            {isUsingSharedBot ? <Globe className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">
                                                {isUsingSharedBot ? `Bot Sistem: ${isUsingSharedBot.name}` : `+${linkedSessionId}`}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={status === 'connected' ? 'default' : 'destructive'}
                                                    className={status === 'connected' ? 'bg-emerald-500' : ''}>
                                                    {status === 'connected' ? t.whatsapp_mgmt.status.connected : t.whatsapp_mgmt.status.disconnected}
                                                </Badge>
                                                {status === 'connected' && <span className="text-xs text-slate-400">
                                                    {isUsingSharedBot ? t.whatsapp_mgmt.status.system_infra : t.whatsapp_mgmt.status.ready}
                                                </span>}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(true)} className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold">
                                        {isUsingSharedBot ? t.whatsapp_mgmt.action.unlink_bot : t.whatsapp_mgmt.action.disconnect}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* OTP SETTINGS (Same as before) */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t.settings.otp_config}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditingOtp(!isEditingOtp)} className="h-8 w-8">
                                {isEditingOtp ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {!isEditingOtp ? (
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.settings.otp_duration}</p>
                                        <p className="text-lg font-black text-primary">{settings.otp_duration_minutes || '5'} Menit</p>
                                    </div>
                                    <div className="space-y-0.5 text-right flex-1 px-4">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.settings.otp_message_template}</p>
                                        <p className="text-xs font-medium text-slate-600 line-clamp-1">{settings.otp_message_template || DEFAULT_OTP_TEMPLATE}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in zoom-in-95">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-600">{t.settings.otp_duration}</Label>
                                        <div className="relative">
                                            <Input
                                                type="number" min="1" max="60"
                                                value={settings.otp_duration_minutes || '5'}
                                                onChange={(e) => setSettings({ ...settings, otp_duration_minutes: e.target.value })}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-slate-500">Menit</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-600">{t.settings.otp_message_template}</Label>
                                        <Textarea
                                            className="font-mono text-xs" rows={3}
                                            value={settings.otp_message_template ?? DEFAULT_OTP_TEMPLATE}
                                            onChange={(e) => setSettings({ ...settings, otp_message_template: e.target.value })}
                                        />
                                    </div>
                                    <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full" size="sm">
                                        {isSavingSettings ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-2" />}
                                        Simpan
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-5 space-y-6">
                    {/* TEST SENDER */}
                    {linkedSessionId && (
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="cursor-pointer bg-slate-50/50 py-3" onClick={() => setIsTestExpanded(!isTestExpanded)}>
                                <CardTitle className="text-sm font-bold flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Send className="h-4 w-4" /> {t.whatsapp_mgmt.test.title}</span>
                                    {isTestExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </CardTitle>
                            </CardHeader>
                            {isTestExpanded && (
                                <CardContent className="space-y-4 pt-4">

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs">{t.whatsapp_mgmt.test.recipient}</Label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 font-normal">
                                                        {t.whatsapp_mgmt.test.select_contact} <ChevronDown className="ml-1 h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>{t.whatsapp_mgmt.test.quick_contact}</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {user?.phone && (
                                                        <DropdownMenuItem onClick={() => {
                                                            let p = user.phone;
                                                            if (p.startsWith('62')) { setCountryCode('62'); p = p.slice(2); }
                                                            else if (p.startsWith('0')) { setCountryCode('62'); p = p.slice(1); }
                                                            setTestPhone(p);
                                                        }}>
                                                            {t.whatsapp_mgmt.test.me} ({user.phone})
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => {
                                                        setCountryCode('62');
                                                        setTestPhone('8561366636');
                                                    }}>
                                                        {t.whatsapp_mgmt.test.developer} (Hasan Askari)
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="flex gap-2">
                                            <Popover open={openCountry} onOpenChange={setOpenCountry}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={openCountry}
                                                        className="w-[90px] justify-between px-3"
                                                    >
                                                        {countryCode
                                                            ? `+${countryCode}`
                                                            : "Select code..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Cari negara..." />
                                                        <CommandList>
                                                            <CommandEmpty>Negara tidak ditemukan.</CommandEmpty>
                                                            <CommandGroup>
                                                                {COUNTRY_CODES.map((c) => (
                                                                    <CommandItem
                                                                        key={c.code + c.name}
                                                                        value={c.name + " " + c.code}
                                                                        onSelect={() => {
                                                                            setCountryCode(c.code)
                                                                            setOpenCountry(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                countryCode === c.code ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        <span className="flex-1 truncate">
                                                                            {c.flag} (+{c.code}) {c.name}
                                                                        </span>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <Input
                                                placeholder="81234567890"
                                                value={testPhone}
                                                onChange={(e) => setTestPhone(e.target.value)}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs">{t.whatsapp_mgmt.test.message_body}</Label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 font-normal">
                                                        {t.whatsapp_mgmt.test.fill_template} <ChevronDown className="ml-1 h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setTestMessage(t.whatsapp_mgmt.test.default_msg)}>
                                                        Default
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setTestMessage(`*Kode Verifikasi HRIS*\n\nKode OTP Anda: *${Math.floor(100000 + Math.random() * 900000)}*\n\nJangan berikan kode ini kepada siapapun.`)}>
                                                        OTP (Kode Acak)
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <Textarea
                                            value={testMessage}
                                            onChange={(e) => setTestMessage(e.target.value)}
                                            rows={3}
                                            className="resize-none"
                                        />
                                    </div>
                                    <Button onClick={handleSendTest} disabled={isTestSending || status !== 'connected'} className="w-full">
                                        {isTestSending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.whatsapp_mgmt.test.send}
                                    </Button>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* SUPERADMIN LOGS */}
                    {user?.role === 'SUPERADMIN' && (
                        <Card className="shadow-sm border-slate-200 overflow-hidden">
                            <CardHeader className="cursor-pointer bg-slate-900 text-slate-100 py-2 px-3" onClick={() => setIsLogsExpanded(!isLogsExpanded)}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                                        <Terminal className="h-3 w-3" /> {t.whatsapp_mgmt.logs}
                                    </span>
                                    {isLogsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </div>
                            </CardHeader>
                            {isLogsExpanded && (
                                <CardContent className="p-0 bg-slate-900">
                                    <div className="h-64 overflow-y-auto p-3 font-mono text-[10px] space-y-0.5 text-slate-300">
                                        {logs.slice().reverse().map((log, i) => (
                                            <div key={i} className="break-all border-b border-white/5 pb-0.5">
                                                {log}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={isUsingSharedBot ? t.whatsapp_mgmt.action.unlink_title : t.whatsapp_mgmt.action.disconnect_title}
                description={isUsingSharedBot
                    ? t.whatsapp_mgmt.action.unlink_desc
                    : t.whatsapp_mgmt.action.disconnect_desc}
                confirmText={isUsingSharedBot ? t.whatsapp_mgmt.action.unlink_confirm : t.whatsapp_mgmt.action.disconnect_confirm}
                variant="danger"
                onConfirm={handleUnlinkSession}
            />

            <style jsx>{`
                @keyframes scan {
                    0% { top: 10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 90%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}

