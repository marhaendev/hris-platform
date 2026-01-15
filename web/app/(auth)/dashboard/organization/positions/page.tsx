'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Eye, Trash2, Search, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from 'sonner';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface Position {
    id: number;
    title: string;
    level: string;
    departmentId: number;
    employeeCount?: number;
    department: {
        name: string;
        code: string;
    };
}

export default function PositionsPage() {
    const [positions, setPositions] = useState<Position[]>([]);
    const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
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
        const filtered = positions.filter(pos =>
            pos.title.toLowerCase().includes(lowerQuery) ||
            pos.level.toLowerCase().includes(lowerQuery) ||
            pos.department.name.toLowerCase().includes(lowerQuery)
        );
        setFilteredPositions(filtered);
        setCurrentPage(1); // Reset to first page when search changes
    }, [searchQuery, positions]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/positions');
            const data = await res.json();
            setPositions(data);
            setFilteredPositions(data);
        } catch (error) {
            console.error("Failed to fetch positions", error);
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
        await fetch(`/api/positions?id=${deleteTargetId}`, { method: 'DELETE' });
        toast.success(t?.organization?.toast?.positionDeleteSuccess || 'Posisi berhasil dihapus!');
        fetchData();
        setDeleteTargetId(null);
    };

    return (
        <TooltipProvider>
            <div className="flex-1 space-y-8 p-8 pt-6">
                <div className="space-y-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-800">{t?.organization?.edit?.positionsTitle || 'Posisi / Jabatan'}</h2>
                        <p className="text-slate-500">{t?.organization?.edit?.positionsSubtitle || 'Daftar posisi di departemen ini.'}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder={t?.organization?.position?.new?.searchPlaceholder || 'Cari posisi...'}
                                className="pl-8 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Link href="/dashboard/organization/positions/new" className="w-full sm:w-auto">
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
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
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
                                    </div>
                                    <div className="h-6 bg-slate-200 rounded w-full"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Calculate pagination */}
                        {(() => {
                            const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
                            const startIndex = (currentPage - 1) * itemsPerPage;
                            const endIndex = startIndex + itemsPerPage;
                            const paginatedPositions = filteredPositions.slice(startIndex, endIndex);

                            return (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {paginatedPositions.map((pos) => (
                                            <Card key={pos.id} className="hover:shadow-md transition-shadow">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg flex-shrink-0">
                                                                <Briefcase className="h-5 w-5" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h3 className="font-semibold text-sm truncate" title={pos.title}>{pos.title}</h3>
                                                                <p className="text-xs text-slate-500">{pos.level}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Link href={`/dashboard/organization/positions/${pos.id}/edit`}>
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
                                                                        onClick={(e) => handleDelete(pos.id, e)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{t?.organization?.tooltip?.delete || 'Hapus Posisi'}</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                                        <Building2 className="h-3 w-3" />
                                                        <span className="truncate">{pos.department.name}</span>
                                                    </div>
                                                    {pos.employeeCount !== undefined && pos.employeeCount > 0 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-2">
                                                            {pos.employeeCount} {pos.employeeCount === 1 ? 'karyawan' : 'karyawan'}
                                                        </span>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}

                                        {!isLoading && filteredPositions.length === 0 && (
                                            <div className="text-center py-12 text-slate-500 col-span-full">
                                                {searchQuery ? (t?.organization?.empty?.noMatch || 'Tidak ada posisi yang cocok.') : (t?.organization?.edit?.noPositions || 'Belum ada posisi.')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-6 px-2">
                                            <div className="text-sm text-slate-600">
                                                {t?.organization?.pagination?.showing || 'Menampilkan'} {startIndex + 1}-{Math.min(endIndex, filteredPositions.length)} {t?.organization?.pagination?.of || 'dari'} {filteredPositions.length} {t?.organization?.pagination?.positions || 'posisi'}
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
                title={t?.organization?.position?.confirmDelete?.title || 'Hapus Posisi?'}
                description={t?.organization?.position?.confirmDelete?.description || 'Posisi ini akan dihapus secara permanen dari departemen.'}
                confirmText={t?.organization?.confirmDelete?.confirm || 'Ya, Hapus'}
                variant="danger"
                onConfirm={confirmDelete}
            />
        </TooltipProvider >
    );
}
