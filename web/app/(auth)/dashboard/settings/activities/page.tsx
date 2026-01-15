'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Timer, Save, Loader2, MapPin, ClipboardList } from "lucide-react";
import { toast } from 'sonner';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Checkbox } from '@/components/ui/checkbox';

export default function ActivitiesSettingsPage() {
    const [settings, setSettings] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const user = useUser();
    const router = useRouter();
    const { t, locale } = useLanguage();

    useEffect(() => {
        if (user && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN' && user.role !== 'COMPANY_OWNER') {
            router.push('/dashboard');
            return;
        }

        fetch('/api/system/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setIsLoading(false);
            })
            .catch(err => setIsLoading(false));
    }, [user, router]);

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
                toast.error(locale === 'id' ? 'Gagal menyimpan settings' : 'Failed to save settings');
            } else {
                toast.success(locale === 'id' ? 'Pengaturan berhasil disimpan!' : 'Settings saved successfully!');
            }
        } catch (err: any) {
            toast.error(err.message);
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
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        {t.activity_settings?.title || (locale === 'id' ? 'Aktivitas' : 'Activities')}
                    </h2>
                    <p className="text-slate-500">
                        {t.activity_settings?.subtitle || (locale === 'id' ? 'Kelola parameter absensi dan kebijakan cuti perusahaan.' : 'Manage attendance parameters and company leave policies.')}
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {t.settings?.save_changes || 'Simpan Perubahan'}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Attendance Settings */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Timer className="h-5 w-5 text-primary" />
                            <CardTitle>{t.activity_settings?.attendance?.title || (locale === 'id' ? 'Kebijakan Absensi' : 'Attendance Policy')}</CardTitle>
                        </div>
                        <CardDescription>
                            {t.activity_settings?.attendance?.desc || 'Atur jam kerja, lokasi kantor, dan toleransi absensi.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="office_start_time">{t.settings?.office_start_time || 'Jam Masuk'}</Label>
                                <Input
                                    id="office_start_time"
                                    type="time"
                                    value={settings.office_start_time || '09:00'}
                                    onChange={(e) => setSettings({ ...settings, office_start_time: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="office_end_time">{t.settings?.office_end_time || 'Jam Pulang'}</Label>
                                <Input
                                    id="office_end_time"
                                    type="time"
                                    value={settings.office_end_time || '17:00'}
                                    onChange={(e) => setSettings({ ...settings, office_end_time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="enable_auto_checkout"
                                checked={settings.enable_auto_checkout === 'true'}
                                onCheckedChange={(checked) => setSettings({ ...settings, enable_auto_checkout: checked.toString() })}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label htmlFor="enable_auto_checkout" className="text-sm font-medium leading-none">
                                    {t.settings?.enable_auto_checkout || 'Aktifkan Auto Check-out'}
                                </label>
                                <p className="text-xs text-slate-500 italic">
                                    {t.settings?.auto_checkout_desc || 'Check-out otomatis jika karyawan lupa.'}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t space-y-4">
                            <Label className="text-xs font-bold uppercase text-slate-400">
                                {t.activity_settings?.attendance?.office_location || 'Lokasi Kantor'}
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="office_lat">Latitude</Label>
                                    <Input
                                        id="office_lat"
                                        type="text"
                                        value={settings.office_latitude || ''}
                                        onChange={(e) => setSettings({ ...settings, office_latitude: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="office_lng">Longitude</Label>
                                    <Input
                                        id="office_lng"
                                        type="text"
                                        value={settings.office_longitude || ''}
                                        onChange={(e) => setSettings({ ...settings, office_longitude: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="radius">{t.settings?.radius_max || 'Radius Maksimal (Meter)'}</Label>
                                <Input
                                    id="radius"
                                    type="number"
                                    value={settings.attendance_radius_meters || '100'}
                                    onChange={(e) => setSettings({ ...settings, attendance_radius_meters: e.target.value })}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                    if (navigator.geolocation) {
                                        navigator.geolocation.getCurrentPosition((pos) => {
                                            setSettings({
                                                ...settings,
                                                office_latitude: pos.coords.latitude.toString(),
                                                office_longitude: pos.coords.longitude.toString()
                                            });
                                            toast.success(locale === 'id' ? 'Lokasi berhasil diambil' : 'Location captured');
                                        });
                                    }
                                }}
                            >
                                <MapPin className="mr-2 h-4 w-4" /> {t.settings?.get_current_loc || 'Ambil Lokasi Sekarang'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Leave Policy Settings */}
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            <CardTitle>{t.activity_settings?.leave?.title || 'Kebijakan Cuti'}</CardTitle>
                        </div>
                        <CardDescription>
                            {t.activity_settings?.leave?.desc || 'Kelola kuota cuti tahunan dan aturan lainnya.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="annual_quota">{t.activity_settings?.leave?.annual_quota || 'Kuota Cuti Tahunan'}</Label>
                            <Input
                                id="annual_quota"
                                type="number"
                                placeholder="12"
                                value={settings.leave_annual_quota || ''}
                                onChange={(e) => setSettings({ ...settings, leave_annual_quota: e.target.value })}
                            />
                            <p className="text-xs text-slate-500">
                                {t.activity_settings?.leave?.quota_desc || 'Jumlah standar cuti tahunan karyawan baru.'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="min_notice">{t.activity_settings?.leave?.min_notice || 'Pemberitahuan Minimal (Hari)'}</Label>
                            <Input
                                id="min_notice"
                                type="number"
                                placeholder="3"
                                value={settings.leave_min_notice || ''}
                                onChange={(e) => setSettings({ ...settings, leave_min_notice: e.target.value })}
                            />
                            <p className="text-xs text-slate-500">
                                {t.activity_settings?.leave?.min_notice_desc || 'Lama hari minimal pengajuan sebelum tanggal cuti.'}
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            <p className="text-xs text-center text-slate-500">
                                {locale === 'id'
                                    ? 'Fitur pengaturan cuti tambahan akan segera hadir.'
                                    : 'Additional leave settings coming soon.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
