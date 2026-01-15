'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, Search, Briefcase, Building2, MoreHorizontal, Edit, Check, Eye } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sparkles } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<string>('all');
    const [selectedDept, setSelectedDept] = useState<string>('all');
    const [departments, setDepartments] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { t } = useLanguage();

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [massDeleteOpen, setMassDeleteOpen] = useState(false);
    const [isMassDeleting, setIsMassDeleting] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    // Dummy Generator State
    const [generateOpen, setGenerateOpen] = useState(false);
    const [generateCount, setGenerateCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Employees
            fetch('/api/employees')
                .then(res => res.json())
                .then(data => {
                    setEmployees(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setIsLoading(false);
                });

            // Fetch Depts & Positions for Edit Form
            fetch('/api/organization/departments').then(res => res.json()).then(setDepartments);
            fetch('/api/organization/positions').then(res => res.json()).then(setPositions);
        };
        fetchData();
    }, []);

    async function handleDelete(id: number) {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    }

    async function confirmDelete() {
        if (!deleteTargetId) return;
        await fetch(`/api/employees/${deleteTargetId}`, { method: 'DELETE' });
        toast.success(t.employees.toast.deleteSuccess);
        setEmployees(employees.filter(e => e.id !== deleteTargetId));
        router.refresh();
        setDeleteTargetId(null);
    }

    async function handleGenerate() {
        setGenerateOpen(false); // Close modal immediately
        setIsGenerating(true);
        try {
            const res = await fetch('/api/employees/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: generateCount })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed');

            toast.success(`Berhasil membuat ${result.count} data dummy`);
            window.location.reload(); // Reload to fetch new data
        } catch (e: any) {
            toast.error(e.message);
            setIsGenerating(false); // Only set false on error, success will reload
        }
    }

    async function handleMassDelete() {
        setIsMassDeleting(true);
        try {
            const res = await fetch('/api/employees/all', {
                method: 'DELETE',
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed');

            toast.success(`Berhasil menghapus ${result.count} data karyawan`);
            setMassDeleteOpen(false);
            window.location.reload();
        } catch (e: any) {
            toast.error(e.message);
            setIsMassDeleting(false);
        }
    }

    // Impersonation removed

    // Get unique positions and departments for filter
    const uniquePositions = Array.from(new Set(employees.map(e => e.position).filter(Boolean)));
    const uniqueDepts = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.user.name.toLowerCase().includes(search.toLowerCase()) ||
            emp.position.toLowerCase().includes(search.toLowerCase()) ||
            emp.department?.toLowerCase().includes(search.toLowerCase());

        const matchesPosition = selectedPosition === 'all' || emp.position === selectedPosition;
        const matchesDept = selectedDept === 'all' || emp.department === selectedDept;

        return matchesSearch && matchesPosition && matchesDept;
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedPosition, selectedDept]);

    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);


    return (
        <div className="space-y-6 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">{t.employees.title}</h1>
                    <p className="text-slate-500">{t.employees.subtitle}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" onClick={() => setMassDeleteOpen(true)} className="gap-2 hidden md:flex" title="Hapus Semua Karyawan">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setGenerateOpen(true)} className="gap-2 hidden md:flex">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        Generate Dummy
                    </Button>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                        <Link href="/dashboard/users/employees/new">
                            <Plus className="mr-2 h-4 w-4" /> {t.employees.add}
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    {isGenerating && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-blue-700 animate-in fade-in slide-in-from-top-2">
                            <Sparkles className="h-5 w-5 animate-spin" />
                            <div>
                                <p className="font-semibold">Sedang men-generate {generateCount} data...</p>
                                <p className="text-sm opacity-90">
                                    Estimasi waktu: ±{Math.ceil(generateCount / 2000)} detik.
                                    Mohon tunggu, halaman akan refresh otomatis.
                                </p>
                            </div>
                        </div>
                    )}
                    {isMassDeleting && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                            <Trash2 className="h-5 w-5 animate-pulse" />
                            <div>
                                <p className="font-semibold">Sedang MENGHAPUS SEMUA DATA...</p>
                                <p className="text-sm opacity-90">Mohon tunggu, jangan tutup halaman ini.</p>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <CardTitle className="text-slate-800">{t.employees.listTitle}</CardTitle>
                        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">

                            {/* Position Filter */}
                            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                                <SelectTrigger className="w-full md:w-[160px]">
                                    <SelectValue placeholder="Filter Posisi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Posisi</SelectItem>
                                    {uniquePositions.map((pos: any) => (
                                        <SelectItem key={pos} value={pos}>
                                            {pos}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Department Filter */}
                            <Select value={selectedDept} onValueChange={setSelectedDept}>
                                <SelectTrigger className="w-full md:w-[160px]">
                                    <SelectValue placeholder="Filter Dept" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Dept</SelectItem>
                                    {uniqueDepts.map((dept: any) => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder={t.employees.searchPlaceholder}
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.employees.table.name}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.employees.table.role}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.employees.table.salary}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.employees.table.status}</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t.employees.table.actions}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-slate-200"></div>
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-32 bg-slate-200 rounded"></div>
                                                        <div className="h-3 w-40 bg-slate-200 rounded"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-2">
                                                    <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                                    <div className="h-3 w-32 bg-slate-200 rounded"></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="h-8 w-8 bg-slate-200 rounded ml-auto"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <>
                                        {paginatedEmployees.map((emp) => (
                                            <tr key={emp.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/users/employees/${emp.id}`)}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                                {emp.user.name.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="text-sm font-semibold text-slate-900 hover:text-primary hover:underline">{emp.user.name}</div>
                                                            <div className="text-sm text-slate-500">{emp.user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                                                            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                                                            {emp.position}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                            {emp.department}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">
                                                    Rp {emp.baseSalary.toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">{t.employees.status.active}</Badge>
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
                                                            <DropdownMenuLabel>{t.employees.table.actions}</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/users/employees/${emp.id}`); }}>
                                                                <Eye className="mr-2 h-4 w-4" /> {t.employees.actions.detail}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> {t.employees.actions.delete}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredEmployees.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                                                    {employees.length === 0 ? t.employees.empty.noData : t.employees.empty.noMatch}
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination Controls - Always Visible */}
            {!isLoading && employees.length > 0 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-slate-500">
                        {t?.common?.showing || 'Menampilkan'} {startIndex + 1} - {Math.min(endIndex, filteredEmployees.length)} {t?.common?.of || 'dari'} {filteredEmployees.length} {t?.common?.data || 'data'}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            {t?.common?.prev || 'Sebelumnya'}
                        </Button>
                        <div className="text-sm font-medium text-slate-700">
                            Hal {currentPage} / {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            {t?.common?.next || 'Selanjutnya'}
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={t.employees.deleteDialog.title}
                description={t.employees.deleteDialog.description}
                confirmText={t.employees.deleteDialog.confirm}
                variant="danger"
                onConfirm={confirmDelete}
            />

            {/* Generate Dialog */}
            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            Generate Data Dummy
                        </DialogTitle>
                        <CardDescription>
                            Buat data karyawan dummy secara otomatis untuk testing.
                        </CardDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="preset" className="text-right">
                                Preset
                            </Label>
                            <Select onValueChange={(val) => setGenerateCount(Number(val))}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Pilih Jumlah..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 50, 100, 500, 1000, 5000, 10000, 20000, 50000, 100000].map((num) => (
                                        <SelectItem key={num} value={num.toString()}>
                                            {num} Data
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="count" className="text-right">
                                Custom
                            </Label>
                            <Input
                                id="count"
                                type="number"
                                min={1}
                                max={100000}
                                value={generateCount}
                                onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGenerateOpen(false)}>Batal</Button>
                        <Button onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? 'Memproses...' : 'Generate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={massDeleteOpen}
                onOpenChange={setMassDeleteOpen}
                title="Hapus SEMUA Data Karyawan?"
                description="Tindakan ini sangat berbahaya! Semua data karyawan, absensi, gaji, dan dokumen akan dihapus PERMANEN. Hanya data Admin/Superadmin yang tersisa. Anda yakin?"
                confirmText="Ya, Hapus Semuanya"
                variant="danger"
                onConfirm={handleMassDelete}
            />
        </div>
    );
}
