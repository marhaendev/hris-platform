'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function EditPositionPage({ params }: { params: { id: string, positionId: string } }) {
    const router = useRouter();
    const [form, setForm] = useState({ title: '', level: 'Staff' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { t } = useLanguage();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/positions?id=${params.positionId}`);
                if (!res.ok) {
                    toast.error(t?.organization?.toast?.notFound || 'Posisi tidak ditemukan');
                    router.push('/dashboard/organization/departments');
                    return;
                }
                const data = await res.json();
                setForm({ title: data.title, level: data.level });
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [params.positionId, params.id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title) { toast.error(t?.organization?.position?.new?.toast?.fillTitle || 'Mohon isi nama jabatan'); return; }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/positions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    id: params.positionId,
                    departmentId: params.id // Ensure it stays linked to this dept (or use existing if we allowed moving)
                })
            });

            if (res.ok) {
                toast.success(t?.organization?.position?.new?.toast?.updateSuccess || 'Perubahan berhasil disimpan!');
                router.push('/dashboard/organization/departments');
                router.refresh();
            } else {
                toast.error(t?.organization?.position?.new?.toast?.updateFailed || 'Gagal menyimpan perubahan');
            }
        } catch (error) {
            console.error(error);
            toast.error(t?.organization?.position?.new?.toast?.error || 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-8">{t?.organization?.position?.edit?.loading || 'Loading...'}</div>;

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <Link href="/dashboard/organization/departments" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors bg-white w-fit px-3 py-1.5 rounded-md border shadow-sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t?.organization?.position?.edit?.back || 'Kembali'}
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle>{t?.organization?.position?.edit?.title || 'Edit Posisi'}</CardTitle>
                    <CardDescription>{t?.organization?.position?.edit?.subtitle || 'Ubah detail posisi/jabatan.'}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">{t?.organization?.position?.edit?.titleLabel || 'Nama Jabatan'}</Label>
                            <Input
                                id="title"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="level">{t?.organization?.position?.edit?.levelLabel || 'Level'}</Label>
                            <select
                                id="level"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={form.level}
                                onChange={(e) => setForm({ ...form, level: e.target.value })}
                            >
                                <option value="Intern">Intern</option>
                                <option value="Staff">Staff</option>
                                <option value="Senior Staff">Senior Staff</option>
                                <option value="Supervisor">Supervisor</option>
                                <option value="Manager">Manager</option>
                                <option value="Director">Director</option>
                            </select>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Link href="/dashboard/organization/departments">
                            <Button variant="outline" type="button">{t?.organization?.position?.new?.cancel || 'Batal'}</Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting}>
                            <Save className="mr-2 h-4 w-4" /> {t?.organization?.position?.edit?.saveButton || 'Simpan Perubahan'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
