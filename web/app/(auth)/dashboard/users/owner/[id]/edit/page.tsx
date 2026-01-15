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

export default function EditOwnerPage({ params }: { params: { id: string } }) {
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
                // Fetch Session first to check if company is locked
                const sessionRes = await fetch('/api/auth/session');
                let sessionCompanyId = '';
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    if (sessionData.companyId && sessionData.companyId > 0) {
                        sessionCompanyId = sessionData.companyId.toString();
                    }
                }

                // Fetch Companies
                const compRes = await fetch('/api/organization/company?all=true');
                let comps: Company[] = [];
                if (compRes.ok) {
                    comps = await compRes.json();
                    setCompanies(comps);
                }

                // Fetch Owners to find this specific one
                const ownerRes = await fetch('/api/owners');
                if (ownerRes.ok) {
                    const owners = await ownerRes.json();
                    const found = owners.find((o: any) => o.id.toString() === params.id);
                    if (found) {
                        setFormData({
                            name: found.name,
                            email: found.email,
                            password: '', // Leave empty for security
                            companyId: sessionCompanyId || found.companyId.toString()
                        });
                    } else {
                        toast.error('Owner tidak ditemukan');
                        router.push('/dashboard/users/owner');
                    }
                }
            } catch (err) {
                console.error('Failed to fetch data', err);
                toast.error('Gagal memuat data');
            } finally {
                setIsPageLoading(false);
            }
        };
        fetchData();
    }, [params.id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.companyId) {
            toast.error('Harap lengkapi field wajib');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/owners', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: parseInt(params.id),
                    ...formData,
                    companyId: parseInt(formData.companyId)
                })
            });

            if (res.ok) {
                toast.success('Owner berhasil diperbarui');
                router.push(`/dashboard/users/owner/${params.id}`);
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'Gagal memperbarui owner');
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
                    <Link href={`/dashboard/users/owner/${params.id}`}><ChevronLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Edit Profil Owner</h1>
                    <p className="text-slate-500">Perbarui informasi akun pemilik perusahaan.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle>Profil {formData.name}</CardTitle>
                        <CardDescription>
                            Kosongkan password jika tidak ingin mengubahnya.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="companyId" className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                    <Building2 className="h-3.5 w-3.5 text-slate-400" /> Perusahaan Terkait
                                </Label>
                                <Select
                                    value={formData.companyId}
                                    onValueChange={(val) => setFormData({ ...formData, companyId: val })}
                                    disabled={true} // Selalu disabled di edit untuk keamanan integritas data owner terhadap perusahaan
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
                                <p className="text-[10px] text-slate-400 font-medium italic mt-1">
                                    * Perusahaan owner tidak dapat diubah setelah didaftarkan.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                    <UserCircle className="h-3.5 w-3.5 text-slate-400" /> Nama Lengkap
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
                                <Label htmlFor="email" className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                    <Mail className="h-3.5 w-3.5 text-slate-400" /> Alamat Email
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
                                <Label htmlFor="password" className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                    <KeyRound className="h-3.5 w-3.5 text-slate-400" /> Ubah Password <span className="text-slate-400 font-normal lowercase">(Kosongkan jika tidak diubah)</span>
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
                    <CardContent className="pt-4 border-t flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-11 px-6 text-slate-500 hover:text-slate-800"
                            onClick={() => router.back()}
                            disabled={isLoading}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="h-11 px-8 font-bold shadow-md shadow-primary/10 bg-primary hover:bg-primary/90"
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
                                    Simpan Perubahan
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </div>

    );
}
