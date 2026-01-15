'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Save, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EditAdminPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [admin, setAdmin] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [usernameCheck, setUsernameCheck] = useState<{ available: boolean, message?: string }>({ available: true });
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    useEffect(() => {
        const fetchAdmin = async () => {
            try {
                const res = await fetch('/api/admins');
                const data = await res.json();
                const found = data.find((a: any) => a.id.toString() === params.id);

                if (found) {
                    setAdmin(found);
                    setName(found.name);
                    setEmail(found.email);
                    setUsername(found.username || '');
                }
            } catch (error) {
                console.error("Failed to fetch admin", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdmin();
    }, [params.id]);

    // Check username availability when it changes
    useEffect(() => {
        const checkUsername = async () => {
            if (!username || username.length < 3) {
                setUsernameCheck({ available: true });
                return;
            }

            // Don't check if it matches initial username (handled by excludeId efficiently)
            setIsCheckingUsername(true);
            try {
                let url = `/api/user/check-username?username=${username}`;
                // admin.id IS the userId for admins (User table)
                if (admin?.id) {
                    url += `&excludeId=${admin.id}`;
                }
                const res = await fetch(url);
                const data = await res.json();

                if (data.available) {
                    setUsernameCheck({ available: true, message: 'Username tersedia ✅' });
                } else {
                    setUsernameCheck({ available: false, message: `Username sudah dipakai ❌. Saran: ${data.suggestion}` });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsCheckingUsername(false);
            }
        };

        const timeoutId = setTimeout(checkUsername, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [username, admin]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch('/api/admins', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: admin.id,
                    name,
                    email,
                    username,
                    password: password || undefined
                })
            });

            if (res.ok) {
                toast.success('Admin berhasil diperbarui!');
                router.push(`/dashboard/users/admin/${params.id}`);
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Gagal memperbarui');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan saat menyimpan');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
    if (!admin) return <div className="p-8 text-center text-red-500">Admin tidak ditemukan.</div>;

    return (
        <div className="p-6 w-full space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/users/admin/${params.id}`}><ChevronLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Edit Admin</h1>
                    <p className="text-slate-500">Perbarui informasi akun administrator.</p>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Formulir Edit</CardTitle>
                    <CardDescription>Sesuaikan data admin di bawah ini.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Nama Lengkap</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nama Lengkap Admin"
                                    required
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    required
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                                    placeholder="Username untuk login (Unik)"
                                    className="font-mono h-11"
                                />
                                {isCheckingUsername ? (
                                    <p className="text-[11px] text-slate-500">Memeriksa ketersediaan...</p>
                                ) : (
                                    <p className={`text-[11px] italic ${!usernameCheck.available ? "text-red-500 font-bold" : "text-green-600"}`}>
                                        {usernameCheck.message || "Username unik untuk login."}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Password Baru <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span></Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-11 pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-[11px] text-slate-500 italic">Minimal 8 karakter dengan kombinasi simbol & angka.</p>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t">
                            <Button type="button" variant="outline" asChild className="h-11 px-6">
                                <Link href={`/dashboard/users/admin/${params.id}`}>Batal</Link>
                            </Button>
                            <Button type="submit" disabled={saving} className="h-11 px-6 bg-primary hover:bg-primary/90 font-bold shadow-md shadow-primary/10">
                                {saving ? 'Menyimpan...' : <><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</>}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>

    );
}
