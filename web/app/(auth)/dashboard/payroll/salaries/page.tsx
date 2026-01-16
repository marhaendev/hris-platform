'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { Save, Search, Briefcase, Banknote, Loader2, Building2, ChevronLeft, ChevronRight, Check, ChevronsUpDown } from 'lucide-react';
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
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Helper for formatting currency
const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val);
};

export default function PayrollSettingPage() {
    const router = useRouter();
    const user = useUser();
    const [employees, setEmployees] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<string>('all');
    const [selectedDept, setSelectedDept] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        if (user && user.role === 'EMPLOYEE') {
            router.push('/dashboard');
            toast.error(t.common.error);
        }
    }, [user, router, t]);

    // Prevent rendering for unauthorized users
    if (!user || user.role === 'EMPLOYEE') {
        return null;
    }

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
            toast.error(t.common.error);
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
                toast.success(t.payrollSalaries.saveSuccess);
                setEmployees(employees.map(emp =>
                    emp.id === selectedEmployee.id ? { ...emp, baseSalary: Number(newSalary) } : emp
                ));
                setIsDialogOpen(false);
            } else {
                toast.error(t.payrollSalaries.saveError);
            }
        } catch (error) {
            console.error(error);
            toast.error(t.common.error);
        }
    };

    const handleBulkSave = async () => {
        if (!autoPayrollTarget || !autoPayrollSalary) {
            toast.error(t.common.error);
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

            if (res.ok) {
                toast.success(t.payrollSalaries.autoSuccess);
                setIsAutoPayrollOpen(false);
                fetchData();
            } else {
                toast.error(t.payrollSalaries.autoError);
            }
        } catch (error) {
            console.error(error);
            toast.error(t.common.error);
        } finally {
            setIsSubmittingAuto(false);
        }
    };

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

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedPosition, selectedDept]);

    if (loading) return <div className="flex items-center justify-center min-h-[400px] text-slate-400">{t.common.loading}</div>;

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/dashboard/payroll')}
                        className="h-9 w-9 text-slate-500 hover:text-slate-900 bg-white shadow-sm border border-slate-200"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t.payrollSalaries.title}</h1>
                        <p className="text-slate-500 mt-1">{t.payrollSalaries.subtitle}</p>
                    </div>
                </div>
                <Button
                    onClick={() => setIsAutoPayrollOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 md:h-9 w-full md:w-auto"
                >
                    <Save className="h-4 w-4" />
                    {t.payrollSalaries.autoPayroll}
                </Button>
            </div>

            <div className="grid gap-4 md:flex md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder={t.payrollSalaries.searchPlaceholder}
                        className="pl-10 h-10 bg-white border-slate-200 focus-visible:ring-emerald-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                    <SelectTrigger className="w-full md:w-[200px] h-10 bg-white">
                        <SelectValue placeholder={t.common.department} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t.payrollSalaries.allDepartments}</SelectItem>
                        {uniqueDepts.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                    <SelectTrigger className="w-full md:w-[200px] h-10 bg-white">
                        <SelectValue placeholder={t.common.position} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t.payrollSalaries.allPositions}</SelectItem>
                        {uniquePositions.map(pos => (
                            <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card className="border-none shadow-none md:border md:shadow-sm bg-transparent md:bg-white">
                <CardHeader className="px-0 md:px-6 pb-3 pt-0 md:pt-6 hidden md:block">
                    <CardTitle className="text-slate-800">{t.payrollSalaries.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 md:p-6">
                    {/* MOBILE CARD VIEW */}
                    <div className="md:hidden space-y-3">
                        {paginatedEmployees.map((employee) => (
                            <Card key={employee.id} className="overflow-hidden border border-slate-200 shadow-sm transition-transform active:scale-[0.99]" onClick={() => handleEditClick(employee)}>
                                <CardContent className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                            <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                                {employee.user?.name?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-slate-900 truncate pr-2 text-sm">{employee.user?.name}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Building2 className="h-3 w-3 text-emerald-500" />
                                                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider truncate max-w-[80px]">{employee.department}</span>
                                                <span className="text-slate-200 text-xs">•</span>
                                                <Briefcase className="h-3 w-3 text-slate-400" />
                                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate max-w-[80px]">{employee.position}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{t.payrollSalaries.table.salary}</div>
                                        <div className="text-sm font-bold text-slate-900">{formatCurrency(employee.baseSalary || 0)}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {filteredEmployees.length === 0 && (
                            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <h3 className="text-slate-900 font-semibold mb-1">{t.common.noData}</h3>
                                <p className="text-slate-500 text-sm italic">{t.common.noData}</p>
                            </div>
                        )}
                    </div>

                    {/* DESKTOP TABLE VIEW */}
                    <div className="hidden md:block rounded-md border overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.payrollSalaries.table.employee}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.payrollSalaries.table.department} & {t.payrollSalaries.table.position}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.payrollSalaries.table.salary}</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t.common.actions}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {paginatedEmployees.map((emp) => (
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
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                    {emp.department}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">
                                            {formatCurrency(emp.baseSalary || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditClick(emp)}
                                                className="inline-flex gap-2"
                                            >
                                                <Save className="h-3 w-3" /> {t.common.edit}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> {t.common.prev}
                            </Button>
                            <span className="text-slate-600 font-medium">
                                {t.common.page} {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                {t.common.next} <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                        <div className="hidden md:block">
                            {t.common.showing} <span className="font-bold text-slate-600">{(startIndex + 1)}</span> - <span className="font-bold text-slate-600">{Math.min(startIndex + itemsPerPage, filteredEmployees.length)}</span> {t.common.of} <span className="font-bold text-slate-600">{filteredEmployees.length}</span> {t.common.data}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Salary Modal */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md bg-white border-none shadow-xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                <Banknote className="h-5 w-5 text-emerald-500" />
                                {t.payrollSalaries.editTitle}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-500">{t.payrollSalaries.table.employee}</Label>
                                <Input value={selectedEmployee?.user?.name || ''} disabled className="bg-slate-50 font-medium" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-500">{t.payrollSalaries.table.salary}</Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</div>
                                    <Input
                                        type="number"
                                        value={newSalary}
                                        onChange={(e) => setNewSalary(e.target.value)}
                                        className="pl-10 h-11 border-slate-200 focus:ring-emerald-500 text-lg font-bold"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-11 text-slate-500">{t.common.cancel}</Button>
                                <Button onClick={handleSave} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">{t.common.save}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Mass Update Modal */}
            {isAutoPayrollOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md bg-white border-none shadow-xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader className="border-b bg-emerald-50/30">
                            <CardTitle className="flex items-center gap-2 text-slate-800">
                                <Save className="h-5 w-5 text-emerald-500" />
                                {t.payrollSalaries.autoTitle}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <RadioGroup
                                value={autoPayrollType}
                                onValueChange={(v: any) => {
                                    setAutoPayrollType(v);
                                    setAutoPayrollTarget('');
                                }}
                                className="grid grid-cols-2 gap-4"
                            >
                                <Label className={cn(
                                    "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                                    autoPayrollType === 'department' && "border-emerald-500 bg-emerald-50/50"
                                )}>
                                    <RadioGroupItem value="department" className="sr-only" />
                                    <Building2 className="mb-2 h-6 w-6 text-slate-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{t.payrollSalaries.autoTypeDept}</span>
                                </Label>
                                <Label className={cn(
                                    "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                                    autoPayrollType === 'position' && "border-emerald-500 bg-emerald-50/50"
                                )}>
                                    <RadioGroupItem value="position" className="sr-only" />
                                    <Briefcase className="mb-2 h-6 w-6 text-slate-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{t.payrollSalaries.autoTypePos}</span>
                                </Label>
                            </RadioGroup>

                            <div className="space-y-2">
                                <Label className="text-slate-500">{t.payrollSalaries.autoTargetPlaceholder}</Label>
                                <Select value={autoPayrollTarget} onValueChange={setAutoPayrollTarget}>
                                    <SelectTrigger className="h-11 border-slate-200">
                                        <SelectValue placeholder={t.payrollSalaries.autoTargetPlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(autoPayrollType === 'department' ? uniqueDepts : uniquePositions).map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-500">{t.payrollSalaries.table.salary}</Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</div>
                                    <Input
                                        type="number"
                                        value={autoPayrollSalary}
                                        onChange={(e) => setAutoPayrollSalary(e.target.value)}
                                        className="pl-10 h-11 border-slate-200 focus:ring-emerald-500 text-lg font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <Button
                                    onClick={handleBulkSave}
                                    disabled={isSubmittingAuto || !autoPayrollTarget || !autoPayrollSalary}
                                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold gap-2"
                                >
                                    {isSubmittingAuto ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    {t.payrollSalaries.autoConfirm}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsAutoPayrollOpen(false)}
                                    className="w-full text-slate-400"
                                >
                                    {t.common.cancel}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
