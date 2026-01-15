'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Save,
    Loader2,
    Settings2,
    Lock,
    Info,
    CheckCircle2,
    AlertCircle,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Setting {
    key: string;
    value: string;
    label: string;
    description: string;
    isActive: boolean;
}

export default function PayrollSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<Setting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        setIsLoading(true);
        try {
            const res = await fetch('/api/payroll/settings');
            const data = await res.json();
            if (res.ok) {
                setSettings(data.settings);
            } else {
                toast.error(data.error);
            }
        } catch (err) {
            toast.error('Gagal memuat pengaturan');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        setIsSaving(true);
        try {
            const res = await fetch('/api/payroll/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Pengaturan berhasil diperbarui');
            } else {
                toast.error(data.error);
            }
        } catch (err) {
            toast.error('Gagal menyimpan pengaturan');
        } finally {
            setIsSaving(false);
        }
    }

    const handleChange = (key: string, field: 'value' | 'isActive', value: any) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, [field]: value } : s));
    };

    const taxSettings = settings.filter(s => s.key.startsWith('tax_pph21_layer'));
    const deductionSettings = settings.filter(s =>
        !s.key.startsWith('tax_pph21_layer') &&
        s.key !== 'tax_pph21_percent_tier1'
    );

    if (isLoading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                <p className="font-medium animate-pulse">Menyiapkan konfigurasi...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full h-10 w-10 border-slate-200 hover:bg-slate-50 transition-all"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Konfigurasi Penggajian</h1>
                        <p className="text-slate-500">Sesuaikan parameter pajak dan potongan BPJS perusahaan.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-slate-900 hover:bg-slate-800 text-white gap-2 px-6 shadow-lg shadow-slate-200 transition-all"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Simpan Perubahan
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Tax Regulations */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        Tarif PPh21 Progresif
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                                            <Info className="h-3 w-3" />
                                            UU HPP 2024
                                        </div>
                                    </CardTitle>
                                    <CardDescription>Tarif pajak penghasilan sesuai peraturan terbaru yang berlaku.</CardDescription>
                                </div>
                                <div className="bg-amber-50 text-amber-600 p-2 rounded-lg">
                                    <Lock className="h-5 w-5" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50">
                                {taxSettings.map((s) => (
                                    <div key={s.key} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="space-y-1">
                                            <Label className="text-sm font-bold text-slate-800">{s.label}</Label>
                                            <p className="text-xs text-slate-400 max-w-sm italic">{s.description}</p>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                readOnly
                                                value={`${s.value}%`}
                                                className="w-24 h-10 text-right pr-4 font-mono font-bold bg-slate-50 border-slate-200 text-slate-400 pointer-events-none"
                                            />
                                            <Lock className="absolute -top-2 -right-2 h-4 w-4 text-emerald-500 bg-white rounded-full p-0.5 border border-emerald-100 shadow-sm" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <div className="p-4 bg-emerald-50/50 border-t border-emerald-100 flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                            <div className="text-xs text-emerald-700 leading-relaxed">
                                <span className="font-bold">Informasi:</span> Lapisan pengenaan pajak ini dikunci secara default untuk memastikan kepatuhan terhadap regulasi Dirjen Pajak terbaru. Perubahan hanya disarankan jika ada revisi undang-undang resmi.
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Side: Customizable Deductions */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden bg-white h-fit">
                        <CardHeader className="bg-emerald-50/30 border-b border-slate-100">
                            <CardTitle className="text-lg flex items-center gap-2 text-emerald-900">
                                <Settings2 className="h-5 w-5" />
                                Potongan Perusahaan
                            </CardTitle>
                            <CardDescription>Aktifkan dan sesuaikan persentase potongan.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {deductionSettings.map((s) => (
                                <div key={s.key} className={cn(
                                    "space-y-3 p-4 rounded-xl border transition-all duration-300",
                                    s.isActive
                                        ? "bg-white border-slate-100 shadow-sm"
                                        : "bg-slate-50/50 border-dashed border-slate-200 grayscale opacity-70"
                                )}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id={`active-${s.key}`}
                                                checked={s.isActive}
                                                onCheckedChange={(checked) => handleChange(s.key, 'isActive', !!checked)}
                                                className="h-5 w-5 border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                            />
                                            <Label htmlFor={`active-${s.key}`} className="text-sm font-semibold text-slate-700 cursor-pointer">
                                                {s.label}
                                            </Label>
                                        </div>
                                        <div className="relative group flex items-center gap-3">
                                            <Input
                                                type="text"
                                                value={s.value}
                                                disabled={!s.isActive}
                                                onChange={(e) => handleChange(s.key, 'value', e.target.value)}
                                                className={cn(
                                                    "w-24 h-10 text-right pr-8 font-bold transition-all",
                                                    s.isActive ? "bg-white border-slate-200" : "bg-slate-100 border-transparent text-slate-400"
                                                )}
                                            />
                                            <span className="absolute right-3 text-slate-400 font-medium">%</span>
                                        </div>
                                    </div>
                                    <p className="pl-8 text-[11px] text-slate-400 leading-tight italic">
                                        {s.description}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
                        <div className="p-6 space-y-2 relative z-10">
                            <h4 className="font-bold flex items-center gap-2 text-amber-400">
                                <AlertCircle className="h-4 w-4" />
                                Status Aktif
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Hanya komponen yang <b>Centang Aktif</b> yang akan dihitung dalam proses penggajian bulanan. Komponen yang non-aktif akan dianggap 0%.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    </Card>
                </div>
            </div>
        </div>
    );
}
