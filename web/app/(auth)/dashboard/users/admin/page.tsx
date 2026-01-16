'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Trash2, Search, MoreHorizontal, Edit, ShieldCheck, Mail, Calendar, Eye } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { ConfirmDialog } from "@/components/confirm-dialog";
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface Admin {
    id: number;
    name: string;
    email: string;
    createdAt: string;
}

export default function AdminUsersPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter(); // Add router definition
    const { t } = useLanguage();

    // Dialog removed, actions updated to use router push

    // Delete Confirm State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const userRole = useUser()?.role;

    useEffect(() => {
        if (userRole && userRole !== 'COMPANY_OWNER' && userRole !== 'SUPERADMIN') {
            router.push('/dashboard');
            toast.error('Akses Ditolak: Hanya Owner yang dapat mengelola Admin');
            return;
        }
        fetchAdmins();
    }, [userRole]);

    if (!userRole || (userRole !== 'COMPANY_OWNER' && userRole !== 'SUPERADMIN')) {
        return null;
    }

    const fetchAdmins = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admins');
            const data = await res.json();
            setAdmins(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
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
            const res = await fetch(`/api/admins?id=${deleteTargetId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Admin berhasil dihapus');
                setAdmins(admins.filter(a => a.id !== deleteTargetId));
            } else {
                toast.error('Gagal menghapus admin');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan');
        }
        setDeleteTargetId(null);
    };

    // Functions removed

    // Functions removed

    const filteredAdmins = admins.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
    );

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex);

    return (
        <div className="space-y-4 p-4 md:space-y-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg md:text-2xl font-bold tracking-tight text-slate-800">{t.admins.title}</h2>
                    <p className="text-xs md:text-sm text-slate-500">{t.admins.subtitle}</p>
                </div>
                {(userRole === 'COMPANY_OWNER' || userRole === 'SUPERADMIN') && (
                    <Link href="/dashboard/users/admin/new" className="w-full md:w-auto">
                        <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-bold h-9 text-xs md:h-10 md:text-sm">
                            <Plus className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> {t.admins.add}
                        </Button>
                    </Link>
                )}
            </div>

            <Card>
                <CardHeader className="pb-3 p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <CardTitle className="text-base md:text-lg text-slate-800">{t.admins.listTitle}</CardTitle>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 md:h-4 md:w-4 text-slate-400" />
                            <Input
                                placeholder={t.admins.searchPlaceholder}
                                className="pl-8 h-9 text-xs md:h-10 md:text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 md:p-6 pt-0 md:pt-0">
                    <div className="border-y md:border md:rounded-md overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 md:px-6 text-left text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider">{t.admins.table.name}</th>
                                    <th className="px-4 py-3 md:px-6 text-left text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">{t.admins.table.email}</th>
                                    <th className="px-4 py-3 md:px-6 text-left text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider">{t.admins.table.role}</th>
                                    <th className="px-4 py-3 md:px-6 text-left text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">{t.admins.table.created}</th>
                                    {(userRole === 'COMPANY_OWNER' || userRole === 'SUPERADMIN') && (
                                        <th className="px-4 py-3 md:px-6 text-right text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider">{t.common.actions}</th>
                                    )}
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
                                ) : filteredAdmins.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-xs md:text-sm text-slate-500">
                                            {search ? t.admins.noMatch : t.admins.empty}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedAdmins.map((admin) => (
                                        <tr key={admin.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/users/admin/${admin.id}`)}>
                                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 md:h-9 md:w-9 bg-primary/10 text-primary">
                                                        <AvatarFallback className="font-bold text-xs md:text-sm">
                                                            {admin.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <div className="font-medium text-slate-900 text-xs md:text-sm">{admin.name}</div>
                                                        <div className="text-[10px] text-slate-500 md:hidden">{admin.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-slate-500 hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                    {admin.email}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 text-[10px] md:text-xs">
                                                    <ShieldCheck className="mr-1 h-3 w-3" />
                                                    Admin
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-xs md:text-sm text-slate-500 hidden sm:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {admin.createdAt ? format(new Date(admin.createdAt), 'dd MMMM yyyy', { locale: idLocale }) : '-'}
                                                </div>
                                            </td>
                                            {(userRole === 'COMPANY_OWNER' || userRole === 'SUPERADMIN') && (
                                                <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-right text-sm">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>{t.common.actions}</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/users/admin/${admin.id}`); }}>
                                                                <Edit className="mr-2 h-4 w-4" /> {t.common.edit}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(admin.id); }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> {t.common.delete}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {!isLoading && filteredAdmins.length > 0 && (
                        <div className="flex items-center justify-between pt-4 px-4 md:px-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 text-xs md:text-sm"
                            >
                                {t.common.prev}
                            </Button>
                            <span className="text-xs md:text-sm text-slate-500">
                                {t.common.page} {currentPage} {t.common.of} {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                                className="h-8 text-xs md:text-sm"
                            >
                                {t.common.next}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirm Dialog */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={t.admins.deleteDialog.title}
                description={t.admins.deleteDialog.description}
                confirmText={t.admins.deleteDialog.confirm}
                variant="danger"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
