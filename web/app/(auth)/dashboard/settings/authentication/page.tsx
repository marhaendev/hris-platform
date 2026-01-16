'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings, Building, Timer, Save, Loader2, MapPin, Settings2, X, Info } from "lucide-react";

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditingJwt, setIsEditingJwt] = useState(false);

    const user = useUser();
    const router = useRouter();
    const { t } = useLanguage();

    useEffect(() => {
        if (user && !['SUPERADMIN', 'COMPANY_OWNER'].includes(user.role)) {
            router.push('/dashboard');
            toast.error("Akses Ditolak: Anda tidak memiliki izin");
            return;
        }

        if (user && ['SUPERADMIN', 'COMPANY_OWNER'].includes(user.role)) {
            fetch('/api/system/settings')
                .then(res => res.json())
                .then(data => {
                    setSettings(data);
                    setIsLoading(false);
                })
                .catch(err => setIsLoading(false));
        }
    }, [user, router]);

    if (!user || !['SUPERADMIN', 'COMPANY_OWNER'].includes(user.role)) {
        return null;
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/system/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error('Gagal menyimpan: ' + (data.error || 'Unknown error'));
            } else {
                toast.success('Pengaturan berhasil disimpan!');
                setIsEditingJwt(false);
            }
        } catch (err: any) {
            toast.error('Gagal menyimpan: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="p-8 flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t.settings.title}</h2>
                    <p className="text-slate-500">Kelola konfigurasi autentikasi</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* JWT Settings */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">{t.settings.jwt_config}</CardTitle>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-slate-400 hover:text-primary transition-colors cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[300px] text-xs p-3">
                                        <p className="font-bold mb-1">Apa itu JWT?</p>
                                        <p>JSON Web Token (JWT) mengatur durasi sesi login. Ketika waktu ini habis, sistem akan melakukan <strong>Logout Otomatis</strong> demi keamanan data Anda.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isEditingJwt ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-primary"
                                    onClick={() => setIsEditingJwt(true)}
                                >
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                                    onClick={() => setIsEditingJwt(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                            <Timer className="h-4 w-4 text-slate-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {!isEditingJwt ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.settings.jwt_hours}</p>
                                        <p className="text-lg font-black text-primary">{settings.jwt_expiration_hours || '0'} Jam</p>
                                    </div>
                                    <div className="space-y-0.5 text-right flex-1 px-4 border-l border-slate-200 ml-4">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.settings.jwt_minutes}</p>
                                        <p className="text-lg font-black text-primary">{settings.jwt_expiration_minutes || '0'} Menit</p>
                                    </div>
                                    <Badge variant="outline" className="bg-white border-slate-200 text-slate-400 text-[10px] font-bold ml-2">
                                        ACTIVE
                                    </Badge>
                                </div>
                                <p className="text-[10px] text-slate-500 italic">
                                    {t.settings.jwt_desc}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="jwt_hours" className="text-xs font-bold text-slate-600">{t.settings.jwt_hours}</Label>
                                        <div className="relative">
                                            <Input
                                                id="jwt_hours"
                                                type="number"
                                                min="0"
                                                max="8760"
                                                className="bg-white border-slate-200 focus:border-primary"
                                                value={settings.jwt_expiration_hours !== undefined ? settings.jwt_expiration_hours : ''}
                                                onChange={(e: any) => setSettings({ ...settings, jwt_expiration_hours: e.target.value })}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">Jam</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="jwt_minutes" className="text-xs font-bold text-slate-600">{t.settings.jwt_minutes}</Label>
                                        <div className="relative">
                                            <Input
                                                id="jwt_minutes"
                                                type="number"
                                                min="0"
                                                max="59"
                                                className="bg-white border-slate-200 focus:border-primary"
                                                value={settings.jwt_expiration_minutes !== undefined ? settings.jwt_expiration_minutes : ''}
                                                onChange={(e: any) => setSettings({ ...settings, jwt_expiration_minutes: e.target.value })}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">Min</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 italic">
                                    {t.settings.jwt_desc}
                                </p>
                                <div className="pt-2 flex gap-2">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        size="sm"
                                        className="flex-1 font-bold shadow-sm"
                                    >
                                        {isSaving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
                                        {t.settings.save_changes}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-400 text-xs font-bold"
                                        onClick={() => setIsEditingJwt(false)}
                                    >
                                        BATAL
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

