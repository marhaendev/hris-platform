'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Database, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import { useRouter } from 'next/navigation';

const FREQUENCY_OPTIONS = [
    { label: 'Harian (Setiap Hari)', value: 'daily' },
    { label: 'Mingguan (Setiap Senin)', value: 'weekly' },
    { label: 'Bulanan (Setiap Tanggal 1)', value: 'monthly' },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
    label: `${i.toString().padStart(2, '0')}:00`,
    value: i.toString()
}));

export default function SystemSettingsPage() {
    const user = useUser();
    const router = useRouter();
    const [settings, setSettings] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Local state for split dropdowns
    const [frequency, setFrequency] = useState('daily');
    const [hour, setHour] = useState('3');

    useEffect(() => {
        // Enforce strict SUPERADMIN access
        if (user && user.role !== 'SUPERADMIN') {
            router.push('/dashboard/settings');
            return;
        }

        fetch('/api/system/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                if (data.auto_vacuum_schedule) {
                    parseCron(data.auto_vacuum_schedule);
                }
                setIsLoading(false);
            })
            .catch(err => setIsLoading(false));
    }, [user, router]);

    const parseCron = (cron: string) => {
        try {
            const parts = cron.split(' ');
            if (parts.length < 5) return;

            // Minute Hour DOM Month DOW
            const h = parts[1];
            const dom = parts[2];
            const dow = parts[4];

            setHour(h);

            if (dom === '*' && dow === '*') {
                setFrequency('daily');
            } else if (dow !== '*') {
                setFrequency('weekly');
            } else if (dom !== '*') {
                setFrequency('monthly');
            }
        } catch (e) {
            console.error("Failed to parse cron", e);
        }
    };

    const getCronString = (freq: string, h: string) => {
        // Default to minute 0
        if (freq === 'daily') return `0 ${h} * * *`;
        if (freq === 'weekly') return `0 ${h} * * 1`; // Monday
        if (freq === 'monthly') return `0 ${h} 1 * *`; // 1st of month
        return `0 ${h} * * *`;
    };

    const handleSave = async () => {
        setIsSaving(true);
        const newSchedule = getCronString(frequency, hour);

        try {
            const res = await fetch('/api/system/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auto_vacuum_enabled: settings.auto_vacuum_enabled,
                    auto_vacuum_schedule: newSchedule
                })
            });

            if (res.ok) {
                toast.success('Pengaturan sistem berhasil disimpan');
                setSettings({ ...settings, auto_vacuum_schedule: newSchedule });
            } else {
                toast.error('Gagal menyimpan pengaturan');
            }
        } catch (e) {
            toast.error('Terjadi kesalahan');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!user || user.role !== 'SUPERADMIN') return null;

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Pengaturan Sistem</h2>
                    <p className="text-slate-500">Konfigurasi teknis dan pemeliharaan (Hanya Superadmin).</p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-600" />
                            <CardTitle>Database Maintenance</CardTitle>
                        </div>
                        <CardDescription>
                            Otomatisasi pembersihan database (VACUUM) untuk menghemat ruang penyimpanan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Automatic Vacuum</Label>
                                <p className="text-sm text-slate-500">
                                    Aktifkan pembersihan otomatis secara berkala.
                                </p>
                            </div>
                            <Switch
                                checked={settings.auto_vacuum_enabled === 'true'}
                                onCheckedChange={(checked) => setSettings({ ...settings, auto_vacuum_enabled: checked ? 'true' : 'false' })}
                            />
                        </div>

                        {settings.auto_vacuum_enabled === 'true' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label>Frekuensi</Label>
                                    <Select
                                        value={frequency}
                                        onValueChange={setFrequency}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Frekuensi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FREQUENCY_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Waktu Eksekusi</Label>
                                    <Select
                                        value={hour}
                                        onValueChange={setHour}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Jam" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-slate-500">
                                        Jadwal aktif: <code>{getCronString(frequency, hour)}</code>
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Simpan Perubahan
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
