'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ChevronLeft,
    Save,
    Loader2,
    UserCircle,
    Mail,
    KeyRound,
    Building2,
    Eye,
    EyeOff
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import Link from 'next/link';

interface Company {
    id: number;
    name: string;
}

export default function NewOwnerPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        companyId: ''
    });
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Session first to see if company is already selected
                const sessionRes = await fetch('/api/auth/session');
                let sessionCompanyId = '';
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    if (sessionData.companyId && sessionData.companyId > 0) {
                        sessionCompanyId = sessionData.companyId.toString();
                        setFormData(prev => ({ ...prev, companyId: sessionCompanyId }));
                    }
                }

                const res = await fetch('/api/organization/company?all=true');
                if (res.ok) {
                    const data = await res.json();
                    setCompanies(data);
                }
            } catch (err) {
                console.error('Failed to fetch data', err);
                toast.error('Gagal memuat daftar perusahaan');
            } finally {
                setIsPageLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const passwordCheck = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/.test(formData.password);

        if (!passwordCheck) {
            toast.error('Password harus minimal 8 karakter dan mengandung huruf kapital, huruf kecil, angka, serta simbol');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/owners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    companyId: parseInt(formData.companyId)
                })
            });

            if (res.ok) {
                toast.success('Owner baru berhasil ditambahkan');
                router.push('/dashboard/users/owner');
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'Gagal menambahkan owner');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan koneksi');
        } finally {
            setIsLoading(false);
        }
    };

    if (isPageLoading) return (
        <div className="p-8 flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="p-6 w-full space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/users/owner"><ChevronLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Tambah Owner Baru</h1>
                    <p className="text-slate-500">Daftarkan akun pemilik perusahaan baru.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Informasi Akun Owner</CardTitle>
                        <CardDescription>
                            Gunakan alamat email yang valid sebagai username login mereka.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="companyId" className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-slate-400" /> Pilih Perusahaan
                                </Label>
                                <Select
                                    value={formData.companyId}
                                    onValueChange={(val) => setFormData({ ...formData, companyId: val })}
                                    disabled={!!formData.companyId && companies.some(c => c.id.toString() === formData.companyId)}
                                >
                                    <SelectTrigger className="bg-white border-slate-200 focus:ring-primary h-11">
                                        <SelectValue placeholder="Pilih perusahaan..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map((company) => (
                                            <SelectItem key={company.id} value={company.id.toString()}>
                                                {company.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!!formData.companyId && (
                                    <p className="text-[10px] text-amber-600 font-medium italic mt-1">
                                        * Terkunci berdasarkan perusahaan yang sedang dikelola.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <UserCircle className="h-4 w-4 text-slate-400" /> Nama Lengkap
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Masukkan nama lengkap..."
                                    className="bg-white border-slate-200 focus:ring-primary h-11"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-slate-400" /> Alamat Email (Untuk Login)
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@perusahaan.com"
                                    className="bg-white border-slate-200 focus:ring-primary h-11"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="flex items-center gap-2">
                                    <KeyRound className="h-4 w-4 text-slate-400" /> Password Akun
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="bg-white border-slate-200 focus:ring-primary h-11 pr-10"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardContent className="pt-2">
                        <Button
                            type="submit"
                            className="w-full h-11 font-bold shadow-md shadow-primary/10"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Simpan Owner
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full mt-2 text-slate-500 hover:text-slate-800"
                            onClick={() => router.back()}
                            disabled={isLoading}
                        >
                            Batal
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
