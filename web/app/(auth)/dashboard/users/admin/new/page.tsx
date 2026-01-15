'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function NewAdminPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!form.name || !form.email || !form.password) {
            setError('Semua field wajib diisi');
            setIsLoading(false);
            return;
        }

        const passwordCheck = {
            isValid: form.password.length >= 8 &&
                /[A-Z]/.test(form.password) &&
                /[a-z]/.test(form.password) &&
                /[0-9]/.test(form.password) &&
                /[!@#$%^&*(),.?":{}|<>]/.test(form.password)
        };

        if (!passwordCheck.isValid) {
            setError('Password harus minimal 8 karakter dan mengandung huruf kapital, huruf kecil, angka, serta simbol');
            setIsLoading(false);
            return;
        }


        try {
            const res = await fetch('/api/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || 'Gagal menambahkan admin');
                setIsLoading(false);
            } else {
                toast.success('Admin berhasil ditambahkan!');
                router.push('/dashboard/users/admin');
            }
        } catch (err) {
            setError('Terjadi kesalahan');
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/users/admin"><ChevronLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tambah Admin</h1>
                    <p className="text-slate-500">Buat akun administrator baru</p>
                </div>
            </div>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Formulir Admin</CardTitle>
                    <CardDescription>Isi detail admin dengan lengkap.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm font-medium border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <Input
                                    id="name"
                                    placeholder="Contoh: Budi Santoso"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email (Digunakan untuk Login)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="contoh@perusahaan.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Nomor Telepon (Opsional)</Label>
                                <Input
                                    id="phone"
                                    placeholder="Contoh: 08123456789"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Minimal 6 karakter"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>


                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="flex-1"
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isLoading} className="flex-1">
                                {isLoading ? (
                                    <>Menyimpan...</>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Simpan
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
