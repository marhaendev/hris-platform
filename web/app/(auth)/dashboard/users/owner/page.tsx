'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Trash2, Search, MoreHorizontal, Edit, UserCircle, Mail, Calendar, Building2, Eye } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { ConfirmDialog } from "@/components/confirm-dialog";
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Owner {
    id: number;
    name: string;
    email: string;
    companyId: number;
    companyName: string;
    createdAt: string;
}

export default function OwnerUsersPage() {
    const [owners, setOwners] = useState<Owner[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Delete Confirm State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    useEffect(() => {
        fetchOwners();
    }, []);

    const fetchOwners = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/owners');
            const data = await res.json();
            setOwners(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat data owner');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
            const res = await fetch(`/api/owners?id=${deleteTargetId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Owner berhasil dihapus');
                setOwners(owners.filter(o => o.id !== deleteTargetId));
            } else {
                toast.error('Gagal menghapus owner');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan');
        }
        setDeleteTargetId(null);
    };

    // Impersonation removed

    const filteredOwners = owners.filter(o =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.email.toLowerCase().includes(search.toLowerCase()) ||
        o.companyName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">Data Owner</h2>
                    <p className="text-slate-500">Kelola akun pemilik perusahaan (Company Owners).</p>
                </div>
                <Link href="/dashboard/users/owner/new">
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold">
                        <Plus className="mr-2 h-4 w-4" /> Tambah Owner
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-slate-800">Daftar Owner</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Cari owner atau perusahaan..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kontak</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Perusahaan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Terdaftar Sejak</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredOwners.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                                            {search ? 'Tidak ada owner yang cocok.' : 'Belum ada data owner.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOwners.map((owner) => (
                                        <tr key={owner.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/users/owner/${owner.id}`)}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 bg-amber-100 text-amber-700">
                                                        <AvatarFallback className="font-bold">
                                                            {owner.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="font-medium text-slate-900">{owner.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                    {owner.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                        {owner.companyName}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">ID: {owner.companyId}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {owner.createdAt ? format(new Date(owner.createdAt), 'dd MMMM yyyy', { locale: idLocale }) : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/users/owner/${owner.id}/edit`); }}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(owner.id); }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirm Dialog */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Hapus Owner?"
                description="Akun owner ini akan dihapus secara permanen. Pastikan perusahaan ini masih memiliki akses atau owner lain."
                confirmText="Ya, Hapus"
                variant="danger"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
