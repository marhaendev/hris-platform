'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { Save, Search, Briefcase, Banknote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Building2, ChevronLeft, ChevronRight, Check, ChevronsUpDown } from "lucide-react"; // Import Building2 and Chevrons
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function PayrollSettingPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<string>('all');
    const [selectedDept, setSelectedDept] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [newSalary, setNewSalary] = useState<string>('');

    // Auto Payroll Dialog State
    const [isAutoPayrollOpen, setIsAutoPayrollOpen] = useState(false);
    const [autoPayrollType, setAutoPayrollType] = useState<'department' | 'position'>('department');
    const [autoPayrollTarget, setAutoPayrollTarget] = useState<string>('');
    const [autoPayrollSalary, setAutoPayrollSalary] = useState<string>('');
    const [isSubmittingAuto, setIsSubmittingAuto] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/employees');
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data karyawan");
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (employee: any) => {
        setSelectedEmployee(employee);
        setNewSalary(employee.baseSalary?.toString() || '0');
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!selectedEmployee) return;

        try {
            const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baseSalary: Number(newSalary) })
            });

            if (res.ok) {
                toast.success("Gaji pokok berhasil diperbarui");
                setEmployees(employees.map(emp =>
                    emp.id === selectedEmployee.id ? { ...emp, baseSalary: Number(newSalary) } : emp
                ));
                setIsDialogOpen(false);
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error("Update failed:", errorData);
                toast.error(`Gagal memperbarui gaji: ${errorData.error || res.statusText}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan");
        }
    };

    const handleBulkSave = async () => {
        if (!autoPayrollTarget || !autoPayrollSalary) {
            toast.error("Mohon lengkapi semua data");
            return;
        }

        setIsSubmittingAuto(true);
        try {
            const res = await fetch('/api/employees/bulk-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: autoPayrollType,
                    id: autoPayrollTarget,
                    baseSalary: Number(autoPayrollSalary)
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || "Gaji berhasil diperbarui secara massal");
                setIsAutoPayrollOpen(false);
                fetchData(); // Refresh all data
            } else {
                toast.error(`Gagal: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsSubmittingAuto(false);
        }
    };

    // Get unique positions and departments for filter
    const uniquePositions = Array.from(new Set(employees.map(e => e.position).filter(Boolean)));
    const uniqueDepts = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            emp.position?.toLowerCase().includes(search.toLowerCase()) ||
            emp.department?.toLowerCase().includes(search.toLowerCase());

        const matchesPosition = selectedPosition === 'all' || emp.position === selectedPosition;
        const matchesDept = selectedDept === 'all' || emp.department === selectedDept;

        return matchesSearch && matchesPosition && matchesDept;
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [openCombobox, setOpenCombobox] = useState(false);

    // Smart Suggestions Logic
    const baseSalaries = Array.from({ length: 30 }, (_, i) => (i + 1) * 1_000_000);

    // Determine suggestions based on current input
    const currentSalaryVal = parseInt(newSalary?.replace(/\D/g, '') || '0');
    let salarySuggestions: number[] = [];

    if (currentSalaryVal > 0 && currentSalaryVal % 1_000_000 === 0 && currentSalaryVal < 30_000_000) {
        // If exact million (e.g., 4.000.000), show steps up to next million (4.1 ... 5.0)
        // User asked for "4100, 4200 sampe 5000" (assuming 4.1M to 5M)
        salarySuggestions = Array.from({ length: 10 }, (_, i) => currentSalaryVal + (i + 1) * 100_000);
    } else {
        // Default base list or filtered base list
        salarySuggestions = baseSalaries;
    }

    // Manual filtering for display (since we use shouldFilter={false})
    // If showing Drill-down, show all (UNLESS user keeps typing non-matching stuff?) 
    // Actually user wants to SEE the options after selecting.
    // So if match is exact million, show drill down.

    // Filter base list if not exact million logic? 
    // If I type "4", I want 4M, 14M, 24M.
    // If I type "4000000", I want 4.1M, 4.2M...
    const displayedSuggestions = salarySuggestions.filter(s => {
        // If we represent a drill-down range (e.g. 4.1M...5M), and input is the base (4M), show all of them.
        if (currentSalaryVal % 1_000_000 === 0 && s > currentSalaryVal && s <= currentSalaryVal + 1_000_000) return true;

        // Otherwise standard string matching
        return s.toString().includes(currentSalaryVal.toString()) || s.toString().includes(newSalary);
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedPosition, selectedDept]);

    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Pengaturan Gaji</h1>
                    <p className="text-slate-500">Kelola informasi gaji pokok karyawan di sini.</p>
                </div>
                <Button onClick={() => setIsAutoPayrollOpen(true)} className="bg-slate-900 hover:bg-slate-800">
                    <Banknote className="mr-2 h-4 w-4" />
                    Atur Gaji Otomatis
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <CardTitle className="text-slate-800">Daftar Gaji Karyawan</CardTitle>
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

                            {/* Search Input */}
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Cari karyawan..."
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Karyawan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Posisi & Departemen</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gaji Pokok</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {paginatedEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                                            Tidak ada data karyawan yang cocok.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedEmployees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                            {emp.user?.name?.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-900">{emp.user?.name}</div>
                                                        <div className="text-sm text-slate-500">{emp.user?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                                                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                                                        {emp.position}
                                                    </div>
                                                    {emp.department && (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                            {emp.department}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">
                                                Rp {emp.baseSalary?.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditClick(emp)}
                                                    className="inline-flex gap-2"
                                                >
                                                    <Save className="h-3 w-3" /> Edit
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination Controls - Always Visible */}
            {!loading && employees.length > 0 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-slate-500">
                        Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredEmployees.length)} dari {filteredEmployees.length} data
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Sebelumnya
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
                            Selanjutnya
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Salary Dialog */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold mb-4">Edit Gaji: {selectedEmployee?.user?.name}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Gaji Pokok (Rp)</label>
                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCombobox}
                                            className="w-full justify-between font-normal"
                                        >
                                            {newSalary ? `Rp ${Number(newSalary).toLocaleString('id-ID')}` : "Pilih atau ketik gaji..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                <input
                                                    className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="Ketik nominal gaji..."
                                                    value={newSalary}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (/^\d*$/.test(val)) setNewSalary(val);
                                                    }}
                                                />
                                            </div>
                                            <CommandList>
                                                <CommandEmpty>Tekan Enter untuk menggunakan "Rp {Number(newSalary || 0).toLocaleString('id-ID')}"</CommandEmpty>
                                                <CommandGroup heading={currentSalaryVal % 1_000_000 === 0 && currentSalaryVal > 0 ? `Saran (lanjutan Rp ${currentSalaryVal.toLocaleString('id-ID')})` : "Saran Gaji (1-30 Juta)"}>
                                                    {displayedSuggestions.map((salary: number) => (
                                                        <CommandItem
                                                            key={salary}
                                                            value={salary.toString()}
                                                            onSelect={(currentValue) => {
                                                                setNewSalary(currentValue);
                                                                if (Number(currentValue) % 1_000_000 === 0) {
                                                                    setOpenCombobox(true);
                                                                } else {
                                                                    setOpenCombobox(false);
                                                                }
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    newSalary === salary.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            Rp {salary.toLocaleString('id-ID')}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-slate-500 mt-1">Ketik manual atau pilih dari daftar yang ada.</p>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                                <Button onClick={handleSave}>Simpan</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Auto Payroll Dialog */}
            {isAutoPayrollOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-emerald-600" />
                            Atur Gaji Otomatis
                        </h2>
                        <div className="space-y-5">
                            <div className="space-y-3">
                                <Label>Target Pengaturan</Label>
                                <RadioGroup defaultValue="department" value={autoPayrollType} onValueChange={(v: any) => setAutoPayrollType(v)}>
                                    <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-slate-50">
                                        <RadioGroupItem value="department" id="r_dept" />
                                        <Label htmlFor="r_dept" className="cursor-pointer flex-1">Per Departemen</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-slate-50">
                                        <RadioGroupItem value="position" id="r_pos" />
                                        <Label htmlFor="r_pos" className="cursor-pointer flex-1">Per Jabatan / Posisi</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label>Pilih {autoPayrollType === 'department' ? 'Departemen' : 'Jabatan'}</Label>
                                <Select value={autoPayrollTarget} onValueChange={setAutoPayrollTarget}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={`Pilih ${autoPayrollType === 'department' ? 'Departemen' : 'Jabatan'}...`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {autoPayrollType === 'department' ? (
                                            uniqueDepts.map((dept: any) => (
                                                <SelectItem key={dept} value={dept.toString()}>{dept}</SelectItem>
                                            ))
                                        ) : (
                                            uniquePositions.map((pos: any) => (
                                                <SelectItem key={pos} value={pos.toString()}>{pos}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Gaji Pokok Baru (Rp)</Label>
                                <Input
                                    placeholder="Masukkan nominal gaji..."
                                    value={autoPayrollSalary}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setAutoPayrollSalary(val);
                                    }}
                                    className="font-mono"
                                />
                                {autoPayrollSalary && (
                                    <p className="text-xs text-green-600 font-medium text-right">
                                        Rp {Number(autoPayrollSalary).toLocaleString('id-ID')}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-6 pt-2 border-t">
                                <Button variant="outline" onClick={() => setIsAutoPayrollOpen(false)} disabled={isSubmittingAuto}>Batal</Button>
                                <Button onClick={handleBulkSave} disabled={isSubmittingAuto}>
                                    {isSubmittingAuto ? "Menyimpan..." : "Terapkan ke Semua"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
