'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, Search, Briefcase, Building2, MoreHorizontal, Edit, Check, Eye, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useUser } from '@/app/(auth)/DashboardClientLayout';

export default function EmployeesPage() {
    const user = useUser();
    const router = useRouter();
    const { t } = useLanguage();

    const [employees, setEmployees] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<string>('all');
    const [selectedDept, setSelectedDept] = useState<string>('all');

    useEffect(() => {
        if (user && !['SUPERADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(user.role)) {
            router.push('/dashboard');
            toast.error("Akses Ditolak: Anda tidak memiliki izin");
        }
    }, [user, router]);

    if (!user || !['SUPERADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(user.role)) {
        return null;
    }

    // Filter Popover States
    const [posFilterOpen, setPosFilterOpen] = useState(false);
    const [deptFilterOpen, setDeptFilterOpen] = useState(false);

    const [departments, setDepartments] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [massDeleteOpen, setMassDeleteOpen] = useState(false);
    const [isMassDeleting, setIsMassDeleting] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    // Dummy Generator State
    const [generateOpen, setGenerateOpen] = useState(false);
    const [generateCount, setGenerateCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);

    // Function to fetch employees data
    const fetchEmployeesData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/employees');
            const data = await res.json();
            if (Array.isArray(data)) {
                setEmployees(data);
            } else {
                console.error("Failed to fetch employees:", data);
                setEmployees([]);
                if (data.error) toast.error(data.error);
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setEmployees([]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            await fetchEmployeesData();
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
            // Refetch data instead of reload
            await fetchEmployeesData();
            setIsGenerating(false);
        } catch (e: any) {
            toast.error(e.message);
            setIsGenerating(false);
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
            // Refetch data instead of reload
            await fetchEmployeesData();
            setIsMassDeleting(false);
        } catch (e: any) {
            toast.error(e.message);
            setIsMassDeleting(false);
        }
    }

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
        <div className="space-y-6 p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">{t.employees.title}</h1>
                    <p className="text-slate-500">{t.employees.subtitle}</p>
                </div>
                <div className="flex gap-2 items-center">
                    {user?.role === 'SUPERADMIN' && (
                        <>
                            <Button variant="outline" onClick={() => setGenerateOpen(true)} className="gap-2 shrink-0" title={t.common.generate}>
                                <Sparkles className="h-4 w-4 text-yellow-500" />
                                <span>{t.common.generate}</span>
                            </Button>
                            <Button variant="destructive" onClick={() => setMassDeleteOpen(true)} className="gap-2 shrink-0" title={t.common.delete}>
                                <Trash2 className="h-4 w-4" />
                                <span>{t.common.delete}</span>
                            </Button>
                        </>
                    )}
                    <Button asChild className="bg-primary hover:bg-primary/90 gap-2 shrink-0" title={t.employees.add}>
                        <Link href="/dashboard/users/employees/new">
                            <Plus className="h-4 w-4" />
                            <span>{t.common.add}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden space-y-4">
                {/* Search & Filters Mobile Placeholder - You might want to duplicate filters here or rely on the desktop ones being responsive? 
                    The previous code had text '... (Search & Filters) ...' at 178 but no actual code. 
                    I will omit it for now or assume the CardHeader below handles global filters? 
                    Actually, the CardHeader is hidden on mobile: <Card className="hidden md:block">
                    So Mobile needs its own filters. 
                    For now, to fix syntax, I will just show the list. Filtering might need to be exposed to mobile later.
                */}

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i} className="overflow-hidden relative border-slate-200">
                                <CardContent className="p-0 flex h-full">
                                    {/* Left Side Skeleton */}
                                    <div className="w-16 bg-slate-50 flex items-center justify-center rounded-r-[40px] shrink-0">
                                        <Skeleton className="h-10 w-10 rounded-full bg-slate-200" />
                                    </div>

                                    {/* Right Side Skeleton */}
                                    <div className="flex-1 p-3 min-w-0 flex flex-col justify-center space-y-3">
                                        {/* Top Row */}
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                            <Skeleton className="h-5 w-12 rounded-full" />
                                        </div>

                                        {/* Middle Row */}
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <div className="space-y-1">
                                                <Skeleton className="h-2 w-8 mb-1" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                            <div className="space-y-1">
                                                <Skeleton className="h-2 w-8 mb-1" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </div>

                                        {/* Bottom Row */}
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                                            <Skeleton className="h-4 w-24" />
                                            <div className="flex gap-1">
                                                <Skeleton className="h-7 w-7 rounded-md" />
                                                <Skeleton className="h-7 w-7 rounded-md" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <>
                        {paginatedEmployees.map((emp) => (
                            <Card key={emp.id} onClick={() => router.push(`/dashboard/users/employees/${emp.id}`)} className="active:scale-[0.98] transition-transform overflow-hidden relative">
                                <CardContent className="p-0 flex h-full">
                                    {/* Left Side - Avatar "Half Circle" Effect */}
                                    <div className="w-16 bg-primary/10 flex items-center justify-center rounded-r-[40px] shrink-0">
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                            <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                                {emp.user.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    {/* Right Side - Content */}
                                    <div className="flex-1 p-3 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-slate-900 truncate pr-2">{emp.user.name}</div>
                                                <div className="text-xs text-slate-500 truncate">{emp.user.email}</div>
                                            </div>
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0 shrink-0">
                                                {t.employees.status.active}
                                            </Badge>
                                        </div>

                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{t.common.position}</div>
                                                <div className="font-medium text-slate-700 truncate text-xs">{emp.position}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{t.common.department}</div>
                                                <div className="font-medium text-slate-700 truncate text-xs">{emp.department}</div>
                                            </div>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
                                            <div className="font-mono text-xs text-slate-600">
                                                Rp {emp.baseSalary.toLocaleString('id-ID')}
                                            </div>
                                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500" onClick={() => router.push(`/dashboard/users/employees/${emp.id}`)}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(emp.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </>
                )}

                {/* Pagination Controls Mobile */}
                {!isLoading && filteredEmployees.length > 0 && (
                    <div className="flex items-center justify-between pt-4 pb-8">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-8 text-xs"
                        >
                            {t.common.prev}
                        </Button>
                        <span className="text-xs text-slate-500">
                            {t.common.page} {currentPage} {t.common.of} {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="h-8 text-xs"
                        >
                            {t.common.next}
                        </Button>
                    </div>
                )}
            </div>

            {/* Desktop Table: Hidden on Mobile */}
            <Card className="hidden md:block">
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
                            <Popover open={posFilterOpen} onOpenChange={setPosFilterOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={posFilterOpen}
                                        className="w-full md:w-[160px] justify-between"
                                    >
                                        <span className="truncate">
                                            {selectedPosition === 'all' ? "Semua Posisi" : selectedPosition}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari posisi..." />
                                        <CommandList>
                                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="all"
                                                    onSelect={() => {
                                                        setSelectedPosition('all');
                                                        setPosFilterOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedPosition === 'all' ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    Semua Posisi
                                                </CommandItem>
                                                {uniquePositions.map((pos: any) => (
                                                    <CommandItem
                                                        key={pos}
                                                        value={pos}
                                                        onSelect={() => {
                                                            setSelectedPosition(pos);
                                                            setPosFilterOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedPosition === pos ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {pos}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {/* Department Filter */}
                            <Popover open={deptFilterOpen} onOpenChange={setDeptFilterOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={deptFilterOpen}
                                        className="w-full md:w-[160px] justify-between"
                                    >
                                        <span className="truncate">
                                            {selectedDept === 'all' ? "Semua Dept" : selectedDept}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari departemen..." />
                                        <CommandList>
                                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="all"
                                                    onSelect={() => {
                                                        setSelectedDept('all');
                                                        setDeptFilterOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedDept === 'all' ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    Semua Dept
                                                </CommandItem>
                                                {uniqueDepts.map((dept: any) => (
                                                    <CommandItem
                                                        key={dept}
                                                        value={dept}
                                                        onSelect={() => {
                                                            setSelectedDept(dept);
                                                            setDeptFilterOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedDept === dept ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {dept}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

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
                                        <tr key={i}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="h-10 w-10 rounded-full" />
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-32" />
                                                        <Skeleton className="h-3 w-40" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Skeleton className="h-4 w-24" />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Skeleton className="h-6 w-16 rounded-full" />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Skeleton className="h-8 w-8 ml-auto" />
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

                    {/* Pagination Controls */}
                    {!isLoading && filteredEmployees.length > 0 && (
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
                                Selanjutnya
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate Dummy Data</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-4 items-center gap-4 py-4">
                        <Label htmlFor="count" className="text-right">
                            Jumlah
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
