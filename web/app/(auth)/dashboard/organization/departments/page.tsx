'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Eye, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from 'sonner';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface Department {
    id: number;
    name: string;
    code: string;
    employeeCount?: number;
}

export default function OrganizationPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const { t } = useLanguage();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = departments.filter(dept =>
            dept.name.toLowerCase().includes(lowerQuery) ||
            dept.code.toLowerCase().includes(lowerQuery)
        );
        setFilteredDepartments(filtered);
        setCurrentPage(1); // Reset to first page when search changes
    }, [searchQuery, departments]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/departments');
            const data = await res.json();
            setDepartments(data);
            setFilteredDepartments(data);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.preventDefault();
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        await fetch(`/api/departments?id=${deleteTargetId}`, { method: 'DELETE' });
        toast.success(t?.organization?.toast?.deleteSuccess || 'Departemen berhasil dihapus!');
        fetchData();
        setDeleteTargetId(null);
    };

    return (
        <TooltipProvider>
            <div className="flex-1 space-y-8 p-8 pt-6">
                <div className="space-y-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-800">{t?.organization?.title || 'Struktur Organisasi'}</h2>
                        <p className="text-slate-500">{t?.organization?.subtitle || 'Kelola Departemen dan Posisi.'}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder={t?.organization?.search || 'Cari departemen...'}
                                className="pl-8 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Link href="/dashboard/organization/departments/new" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" /> {t?.organization?.addButton || 'Tambah'}
                            </Button>
                        </Link>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="p-2 bg-slate-200 rounded-lg w-9 h-9"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-8 h-8 bg-slate-200 rounded"></div>
                                        <div className="w-8 h-8 bg-slate-200 rounded"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Calculate pagination */}
                        {(() => {
                            // Separate active and all departments
                            const activeDepartments = filteredDepartments.filter(dept => dept.employeeCount && dept.employeeCount > 0);
                            const allDepartments = filteredDepartments;

                            const totalPages = Math.ceil(allDepartments.length / itemsPerPage);
                            const startIndex = (currentPage - 1) * itemsPerPage;
                            const endIndex = startIndex + itemsPerPage;
                            const paginatedDepartments = allDepartments.slice(startIndex, endIndex);

                            return (
                                <>
                                    {/* Active Departments Section - Always visible */}
                                    {activeDepartments.length > 0 && (
                                        <>
                                            <div className="mb-6">
                                                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Aktif
                                                    </span>
                                                    Departemen dengan Karyawan
                                                </h3>
                                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                    {activeDepartments.map((dept) => (
                                                        <Card key={dept.id} className="hover:shadow-md transition-shadow border-green-200">
                                                            <CardContent className="p-4 flex items-center justify-between">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div className="p-2 bg-green-100 text-green-600 rounded-lg flex-shrink-0">
                                                                        <Building2 className="h-5 w-5" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h3 className="font-semibold text-sm truncate" title={dept.name}>{dept.name}</h3>
                                                                        <p className="text-xs text-slate-500 font-mono">CODE: {dept.code}</p>
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                                                                            {dept.employeeCount} karyawan
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Link href={`/dashboard/organization/departments/${dept.id}/edit`}>
                                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                                                                                    <Eye className="h-4 w-4" />
                                                                                </Button>
                                                                            </Link>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>{t?.organization?.tooltip?.edit || 'Edit / Detail'}</TooltipContent>
                                                                    </Tooltip>

                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                                                onClick={(e) => handleDelete(dept.id, e)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>{t?.organization?.tooltip?.delete || 'Hapus Departemen'}</TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="relative my-8">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-slate-300"></div>
                                                </div>
                                                <div className="relative flex justify-center text-sm">
                                                    <span className="px-4 bg-slate-50 text-slate-500 font-medium">Semua Departemen</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* All Departments - Paginated */}
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {paginatedDepartments.map((dept) => (
                                            <Card key={dept.id} className="hover:shadow-md transition-shadow">
                                                <CardContent className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                                                            <Building2 className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="font-semibold text-sm truncate" title={dept.name}>{dept.name}</h3>
                                                            <p className="text-xs text-slate-500 font-mono">CODE: {dept.code}</p>
                                                            {dept.employeeCount !== undefined && dept.employeeCount > 0 && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                                                                    {dept.employeeCount} {dept.employeeCount === 1 ? 'karyawan' : 'karyawan'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Link href={`/dashboard/organization/departments/${dept.id}/edit`}>
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t?.organization?.tooltip?.edit || 'Edit / Detail'}</TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                                    onClick={(e) => handleDelete(dept.id, e)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t?.organization?.tooltip?.delete || 'Hapus Departemen'}</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                        {!isLoading && filteredDepartments.length === 0 && (
                                            <div className="text-center py-12 text-slate-500 col-span-full">
                                                {searchQuery ? (t?.organization?.empty?.noMatch || 'Tidak ada departemen yang cocok.') : (t?.organization?.empty?.noData || 'Belum ada departemen created.')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-6 px-2">
                                            <div className="text-sm text-slate-600">
                                                {t?.organization?.pagination?.showing || 'Menampilkan'} {startIndex + 1}-{Math.min(endIndex, allDepartments.length)} {t?.organization?.pagination?.of || 'dari'} {allDepartments.length} {t?.organization?.pagination?.departments || 'departemen'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                                    {t?.organization?.pagination?.previous || 'Sebelumnya'}
                                                </Button>
                                                <div className="text-sm text-slate-600 px-3">
                                                    {t?.organization?.pagination?.page || 'Halaman'} {currentPage} {t?.organization?.pagination?.of || 'dari'} {totalPages}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    {t?.organization?.pagination?.next || 'Selanjutnya'}
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </>
                )}
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={t?.organization?.confirmDelete?.title || 'Hapus Departemen?'}
                description={t?.organization?.confirmDelete?.description || 'Departemen ini akan dihapus beserta semua posisi di dalamnya. Tindakan ini tidak dapat dikembalikan.'}
                confirmText={t?.organization?.confirmDelete?.confirm || 'Ya, Hapus'}
                variant="danger"
                onConfirm={confirmDelete}
            />
        </TooltipProvider >
    );
}
