'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Briefcase, Pencil, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface Department {
    id: number;
    name: string;
    code: string;
}

interface Position {
    id: number;
    title: string;
    level: string;
    departmentId: number;
}

export default function EditDepartmentPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [dept, setDept] = useState<Department | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [form, setForm] = useState({ name: '', code: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const { t } = useLanguage();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Department
                const deptRes = await fetch(`/api/departments?id=${params.id}`);
                if (!deptRes.ok) {
                    toast.error(t?.organization?.toast?.notFound || 'Departemen tidak ditemukan');
                    router.push('/dashboard/organization/departments');
                    return;
                }
                const deptData = await deptRes.json();
                setDept(deptData);
                setForm({ name: deptData.name, code: deptData.code });

                // Fetch Positions
                const posRes = await fetch(`/api/positions?departmentId=${params.id}`);
                setPositions(await posRes.json());
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [params.id, router]);

    const handleSaveDept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.code) { toast.error(t?.organization?.toast?.fillData || 'Mohon lengkapi data'); return; }

        setIsSaving(true);
        try {
            const res = await fetch('/api/departments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, id: params.id })
            });

            if (res.ok) {
                toast.success(t?.organization?.toast?.updateSuccess || 'Perubahan disimpan');
                router.refresh();
            } else {
                toast.error(t?.organization?.toast?.updateFailed || 'Gagal menyimpan');
            }
        } catch (error) {
            console.error(error);
            toast.error(t?.organization?.toast?.error || 'Terjadi kesalahan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePos = async (posId: number) => {
        setDeleteTargetId(posId);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        await fetch(`/api/positions?id=${deleteTargetId}`, { method: 'DELETE' });
        toast.success(t?.organization?.toast?.positionDeleteSuccess || 'Posisi berhasil dihapus!');
        const posRes = await fetch(`/api/positions?departmentId=${params.id}`);
        setPositions(await posRes.json());
        setDeleteTargetId(null);
    };

    if (isLoading) return <div className="p-8">{t?.organization?.edit?.loading || 'Loading...'}</div>;
    if (!dept) return null;

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <Link href="/dashboard/organization/departments" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors bg-white w-fit px-3 py-1.5 rounded-md border shadow-sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t?.organization?.edit?.back || 'Kembali'}
            </Link>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Department Edit Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-slate-800">{t?.organization?.edit?.title || 'Edit Departemen'}</CardTitle>
                        <CardDescription>{t?.organization?.edit?.subtitle || 'Ubah informasi departemen.'}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSaveDept}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t?.organization?.edit?.nameLabel || 'Nama Departemen'}</Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">{t?.organization?.edit?.codeLabel || 'Kode Departemen'}</Label>
                                <Input
                                    id="code"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end">
                            <Button type="submit" disabled={isSaving}>
                                <Save className="mr-2 h-4 w-4" /> {t?.organization?.edit?.saveButton || 'Simpan Perubahan'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Positions Management */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold tracking-tight text-slate-800">{t?.organization?.edit?.positionsTitle || 'Posisi / Jabatan'}</h2>
                        <Link href="/dashboard/organization/positions/new">
                            <Button size="sm" variant="outline">
                                <Plus className="mr-2 h-4 w-4" /> {t?.organization?.edit?.addPosition || 'Tambah Posisi'}
                            </Button>
                        </Link>
                    </div>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>{t?.organization?.edit?.positionsSubtitle || 'Daftar posisi di departemen ini.'}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {positions.length === 0 ? (
                                <p className="text-sm text-slate-500 italic py-4">{t?.organization?.edit?.noPositions || 'Belum ada posisi.'}</p>
                            ) : (
                                positions.map((pos) => (
                                    <div key={pos.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:border-blue-300 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <Briefcase className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                                            <div>
                                                <div className="font-medium">{pos.title}</div>
                                                <div className="text-xs text-slate-400">{pos.level}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/dashboard/organization/positions/${pos.id}/edit`}>
                                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                                    <Pencil className="h-3 w-3 text-slate-500" />
                                                </Button>
                                            </Link>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDeletePos(pos.id)}>
                                                <Trash2 className="h-3 w-3 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={t?.organization?.position?.confirmDelete?.title || 'Hapus Posisi?'}
                description={t?.organization?.position?.confirmDelete?.description || 'Posisi ini akan dihapus secara permanen dari departemen.'}
                confirmText={t?.organization?.confirmDelete?.confirm || 'Ya, Hapus'}
                variant="danger"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
