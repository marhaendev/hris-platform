'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Bell, ArrowLeft, Save, Megaphone, ShieldAlert,
    Info, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from 'sonner';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';
import Link from 'next/link';

const DESTINATIONS = [
    { label: 'Kustom / Input Manual', value: 'custom' },
    { label: 'Dashboard', value: '/dashboard' },
    { label: 'Daftar Karyawan', value: '/dashboard/users/employees' },
    { label: 'Daftar Admin', value: '/dashboard/users/admin' },
    { label: 'Profil Saya (Akun)', value: '/dashboard/profile?tab=basic' },
    { label: 'Ganti Password', value: '/dashboard/profile?tab=password' },
    { label: 'Absensi', value: '/dashboard/attendance' },
    { label: 'Cuti & Izin', value: '/dashboard/leave' },
    { label: 'Integrasi WhatsApp', value: '/dashboard/settings/whatsapp' },
    { label: 'Pengaturan Sistem', value: '/dashboard/settings/website' },
];

const AVAILABLE_ROLES = ['SUPERADMIN', 'COMPANY_OWNER', 'ADMIN', 'EMPLOYEE'];

export default function EditNotificationPage() {
    const router = useRouter();
    const params = useParams();
    const user = useUser();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hrefType, setHrefType] = useState('custom');

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info' as 'info' | 'warning' | 'success',
        href: '',
        targetRoles: 'ADMIN,SUPERADMIN,EMPLOYEE',
        category: 'general',
        isActive: 1
    });

    useEffect(() => {
        const fetchNotif = async () => {
            try {
                // We use the same management list API but filter for the ID
                const res = await fetch('/api/system/notifications?management=true');
                if (res.ok) {
                    const data = await res.json();
                    const notif = data.notifications?.find((n: any) => n.id === parseInt(params.id as string));

                    if (notif) {
                        setFormData({
                            title: notif.title,
                            message: notif.message,
                            type: notif.type,
                            href: notif.href || '',
                            targetRoles: notif.targetRoles,
                            category: notif.category,
                            isActive: notif.isActive
                        });

                        // Detect href type
                        const found = DESTINATIONS.find(d => d.value === notif.href);
                        setHrefType(found ? notif.href : 'custom');
                    } else {
                        toast.error('Notifikasi tidak ditemukan');
                        router.push('/dashboard/settings/notifications');
                    }
                }
            } catch (error) {
                toast.error('Gagal mengambil data notifikasi');
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) fetchNotif();
    }, [params.id, router]);

    const handleSave = async () => {
        if (!formData.title || !formData.message) {
            toast.error('Judul dan pesan wajib diisi');
            return;
        }

        if (!formData.targetRoles) {
            toast.error('Pilih minimal satu Target Role');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/system/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, id: parseInt(params.id as string) })
            });

            if (res.ok) {
                toast.success('Notifikasi berhasil diperbarui');
                router.push('/dashboard/settings/notifications');
            } else {
                const err = await res.json();
                toast.error(err.error || 'Terjadi kesalahan');
            }
        } catch (error) {
            toast.error('Gagal menyimpan notifikasi');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleRole = (role: string) => {
        const roles = formData.targetRoles ? formData.targetRoles.split(',').filter(r => r !== '') : [];
        let newRoles;
        if (roles.includes(role)) {
            newRoles = roles.filter(r => r !== role);
        } else {
            newRoles = [...roles, role];
        }
        setFormData({ ...formData, targetRoles: newRoles.join(',') });
    };

    const toggleAllRoles = (checked: boolean) => {
        setFormData({ ...formData, targetRoles: checked ? AVAILABLE_ROLES.join(',') : '' });
    };

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-slate-500 font-medium animate-pulse text-lg italic">Memuat data notifikasi...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-xl">
                    <Link href="/dashboard/settings/notifications">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Edit Notifikasi</h1>
                    <p className="text-slate-500 font-medium italic">Perbarui rincian pengumuman untuk grup tertentu</p>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/30 p-8">
                    <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" /> Formulir Perubahan
                    </CardTitle>
                    <CardDescription className="italic font-medium">Ubah informasi yang diperlukan pada form di bawah ini</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Judul Notifikasi</label>
                            <Input
                                placeholder="Masukkan judul..."
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="rounded-xl border-slate-200 focus:ring-primary/20 h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Pesan Notifikasi</label>
                            <Textarea
                                placeholder="Masukkan pesan lengkap..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="rounded-xl border-slate-200 focus:ring-primary/20 min-h-[120px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tipe Tampilan</label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v: any) => setFormData({ ...formData, type: v })}
                                >
                                    <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="info">
                                            <div className="flex items-center gap-2">
                                                <Info className="h-4 w-4 text-blue-500" />
                                                <span>Informasi (Biru)</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="warning">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                                <span>Peringatan (Kuning)</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="success">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                <span>Sukses (Hijau)</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(v: any) => setFormData({ ...formData, category: v })}
                                    disabled={(user?.role === 'ADMIN' || user?.role === 'COMPANY_OWNER') && (formData.category === 'system' || formData.category === 'wa')}
                                >
                                    <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">Umum / Broadcast</SelectItem>
                                        {user?.role === 'SUPERADMIN' && (
                                            <>
                                                <SelectItem value="system">Sistem (Alert Merah)</SelectItem>
                                                <SelectItem value="wa">WhatsApp Service</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Halaman Tujuan (Opsional)</label>
                            <div className="grid gap-3">
                                <Select
                                    value={hrefType}
                                    onValueChange={(v) => {
                                        setHrefType(v);
                                        if (v !== 'custom') setFormData({ ...formData, href: v });
                                    }}
                                >
                                    <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                        <SelectValue placeholder="Pilih halaman tujuan..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DESTINATIONS.map(d => (
                                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {(hrefType === 'custom' || !DESTINATIONS.some(d => d.value === formData.href)) && (
                                    <Input
                                        placeholder="/dashboard/halaman-anda"
                                        value={formData.href}
                                        onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                                        className="rounded-xl border-slate-200 focus:ring-primary/20 h-12"
                                    />
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium italic">Klik notifikasi akan mengarahkan pengguna ke halaman ini.</p>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Role</label>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="all-roles"
                                        checked={formData.targetRoles.split(',').filter(r => r !== '').length === AVAILABLE_ROLES.length}
                                        onCheckedChange={(checked) => toggleAllRoles(!!checked)}
                                    />
                                    <label htmlFor="all-roles" className="text-xs font-bold text-slate-500 cursor-pointer">Pilih Semua</label>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                {AVAILABLE_ROLES.map(role => (
                                    <div key={role} className="flex items-center gap-3">
                                        <Checkbox
                                            id={`role-${role}`}
                                            checked={formData.targetRoles.split(',').includes(role)}
                                            onCheckedChange={() => toggleRole(role)}
                                            className="h-5 w-5 rounded-md"
                                        />
                                        <label htmlFor={`role-${role}`} className="text-sm font-bold text-slate-700 cursor-pointer uppercase tracking-tight">{role}</label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium italic">Hanya pengguna dengan role terpilih yang akan melihat notifikasi ini.</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="rounded-xl font-bold px-6 h-12"
                            disabled={isSaving}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="rounded-xl font-bold px-10 h-12 shadow-lg shadow-primary/20 gap-2"
                        >
                            {isSaving ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Simpan Perubahan
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
