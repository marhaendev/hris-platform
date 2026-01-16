'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Banknote,
    Calendar,
    Download,
    Eye,
    FileText,
    History,
    Loader2,
    Play,
    Printer,
    Search,
    User,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Settings2,
    Search as SearchIcon,
    ChevronDown,
    FileJson,
    FileSpreadsheet
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import PayslipModal from './PayslipModal';

interface PayrollRecord {
    id: number;
    period: string;
    baseSalary: number;
    allowances: number;
    deductions: number;
    pph21: number;
    netSalary: number;
    status: string;
    createdAt: string;
    employee: {
        name: string;
        department: string;
        position: string;
    }
}

import { useUser } from '@/app/(auth)/DashboardClientLayout';

export default function PayrollDashboard() {
    const { t, locale } = useLanguage();
    const router = useRouter();
    const user = useUser();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);

    useEffect(() => {
        if (user && user.role === 'EMPLOYEE') {
            router.push('/dashboard');
            toast.error(t.common.error);
        }
    }, [user, router]);

    // Prevent rendering for unauthorized users
    if (!user || user.role === 'EMPLOYEE') {
        return null;
    }

    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Modal State
    const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const months = Array.from({ length: 12 }, (_, i) => {
        return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { month: 'long' }).format(new Date(2000, i, 1));
    });

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        fetchPayrolls();
        setCurrentPage(1); // Reset to first page when month/year changes
    }, [month, year]);

    // Reset pagination when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    async function fetchPayrolls() {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/payroll?month=${month}&year=${year}`);
            const data = await res.json();
            if (res.ok) {
                setPayrolls(data);
            } else {
                toast.error(data.error || t.payrollDashboard.errorFetch);
            }
        } catch (err) {
            toast.error(t.common.error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleGenerate() {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/payroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month, year })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                fetchPayrolls();
            } else {
                toast.error(data.error);
            }
        } catch (err) {
            toast.error(t.payrollDashboard.errorGenerate || 'Failed to generate payroll');
        } finally {
            setIsGenerating(false);
        }
    }

    const filteredPayrolls = payrolls.filter(p =>
        p.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.employee.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredPayrolls.length / rowsPerPage);
    const paginatedPayrolls = filteredPayrolls.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const totalNet = filteredPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const totalPPh21 = filteredPayrolls.reduce((sum, p) => sum + p.pph21, 0);
    const totalEmployees = filteredPayrolls.length;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };



    // ... existing imports removed from inside function


    const handleDownloadCSV = () => {
        if (!payrolls.length) {
            toast.error(t.payrollDashboard.noDataExport);
            return;
        }

        // CSV Header
        const headers = [
            'Periode', 'Nama Karyawan', 'Departemen', 'Jabatan',
            'Gaji Pokok', 'Tunjangan', 'Potongan', 'PPh21', 'Netto', 'Status', 'Tanggal Input'
        ];

        // CSV Rows
        const rows = payrolls.map(p => [
            p.period,
            `"${p.employee.name}"`,
            `"${p.employee.department}"`,
            `"${p.employee.position}"`,
            p.baseSalary,
            p.allowances,
            p.deductions,
            p.pph21,
            p.netSalary,
            p.status,
            new Date(p.createdAt).toLocaleDateString('id-ID')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Payroll_${year}_${month}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t.payrollDashboard.csvSuccess);
    };

    const handleDownloadExcel = () => {
        if (!payrolls.length) {
            toast.error(t.payrollDashboard.noDataExport);
            return;
        }

        // Create HTML Table for Excel
        let tableHTML = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>Payroll ${months[month - 1]} ${year}</x:Name>
                                <x:WorksheetOptions>
                                    <x:DisplayGridlines/>
                                </x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <![endif]-->
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #000000; padding: 5px; }
                    th { -color: #f2f2f2; font-weight: bold; }
                    .num { mso-number-format:"\#\,\#\#0"; }
                    .text { mso-number-format:"\@"; }
                </style>
            </head>
            <body>
                <table>
                    <thead>
                        <tr>
                            <th>Periode</th>
                            <th>Nama Karyawan</th>
                            <th>Departemen</th>
                            <th>Jabatan</th>
                            <th>Gaji Pokok</th>
                            <th>Tunjangan</th>
                            <th>Potongan</th>
                            <th>PPh21</th>
                            <th>Netto</th>
                            <th>Status</th>
                            <th>Tanggal Input</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        payrolls.forEach(p => {
            tableHTML += `
                <tr>
                    <td class="text">${p.period}</td>
                    <td class="text">${p.employee.name}</td>
                    <td class="text">${p.employee.department}</td>
                    <td class="text">${p.employee.position}</td>
                    <td class="num">${p.baseSalary}</td>
                    <td class="num">${p.allowances}</td>
                    <td class="num">${p.deductions}</td>
                    <td class="num">${p.pph21}</td>
                    <td class="num">${p.netSalary}</td>
                    <td class="text">${p.status}</td>
                    <td class="text">${new Date(p.createdAt).toLocaleDateString('id-ID')}</td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Payroll_${year}_${month}.xls`); // .xls works best with HTML method
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t.payrollDashboard.excelSuccess);
    };

    const handlePrintAll = () => {
        if (!payrolls.length) {
            toast.error(t.payrollDashboard.noDataPrint);
            return;
        }
        window.open(`/dashboard/payroll/print?month=${month}&year=${year}`, '_blank');
    };

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t.payrollDashboard.title}</h1>
                    <p className="text-slate-500 mt-1">{t.payrollDashboard.subtitle}</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-3 md:p-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">

                    {/* Period Selectors */}
                    <div className="flex items-center gap-3 flex-1">
                        <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                            <SelectTrigger className="w-full md:w-[140px] border-slate-200 md:border-none focus:ring-0">
                                <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                                <SelectValue placeholder={t.payrollDashboard.month} />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="hidden md:block w-px h-6 bg-slate-200" />

                        <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                            <SelectTrigger className="w-full md:w-[100px] border-slate-200 md:border-none focus:ring-0">
                                <SelectValue placeholder={t.payrollDashboard.year} />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="hidden md:block w-px h-6 bg-slate-200" />

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 md:h-9 md:w-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border md:border-none border-slate-200"
                            onClick={() => router.push('/dashboard/payroll/settings')}
                            title={t.payrollDashboard.settings}
                        >
                            <Settings2 className="h-5 w-5" />
                        </Button>

                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 md:h-9"
                        >
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            {t.payrollDashboard.process}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">{t.payrollDashboard.stats.netTotal}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalNet)}</div>
                        <div className="flex items-center mt-2 text-emerald-400 text-xs font-medium">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            {t.payrollDashboard.stats.netDesc}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t.payrollDashboard.stats.pphTotal}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalPPh21)}</div>
                        <div className="flex items-center mt-2 text-amber-500 text-xs font-medium">
                            <FileText className="h-3 w-3 mr-1" />
                            {t.payrollDashboard.stats.pphDesc}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t.payrollDashboard.stats.employeeCount}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{totalEmployees}</div>
                        <div className="flex items-center mt-2 text-blue-500 text-xs font-medium">
                            <User className="h-3 w-3 mr-1" />
                            {t.payrollDashboard.stats.employeeDesc.replace('{count}', totalEmployees.toString())}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content - Hybrid View */}
            <Card className="border-none shadow-none md:border md:shadow-sm bg-transparent md:bg-white overflow-hidden">
                <div className="px-0 md:px-6 py-0 md:py-5 border-b-0 md:border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 mb-4 md:mb-0">
                    {/* Mobile Header Text */}
                    <div className="md:hidden w-full flex justify-between items-center mb-2">
                        <div className="text-sm font-semibold text-slate-700">{t.payrollDashboard.historyTitle} ({filteredPayrolls.length})</div>
                    </div>

                    <div className="relative w-full md:w-96">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder={t.payrollDashboard.searchPlaceholder}
                            className="pl-10 bg-white md:bg-slate-50 border border-slate-200 md:border-none focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-lg md:rounded-md"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 text-slate-600 border-slate-200">
                                    <Download className="h-4 w-4" />
                                    Export
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleDownloadCSV}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Download CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDownloadExcel}>
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Download Excel (.xls)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="outline"
                            className="gap-2 text-slate-600 border-slate-200"
                            onClick={handlePrintAll}
                        >
                            <Printer className="h-4 w-4" />
                            {t.payrollDashboard.printAll}
                        </Button>
                    </div>
                </div>

                <div className="p-0 md:p-0">
                    {isLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="text-sm font-medium">{t.common.loading}</p>
                        </div>
                    ) : (
                        <>
                            {/* MOBILE LIST VIEW */}
                            <div className="md:hidden space-y-3 pb-4">
                                {paginatedPayrolls.map((payroll) => (
                                    <Card key={payroll.id} className="overflow-hidden border border-slate-200 shadow-sm active:scale-[0.99] transition-transform" onClick={() => {
                                        setSelectedPayroll(payroll);
                                        setIsModalOpen(true);
                                    }}>
                                        <div className="p-4 flex flex-col">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className='flex items-center gap-3'>
                                                    {/* Avatar would be nice here but we don't have it in payroll record currently, just name */}
                                                    <div className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 font-bold text-xs">
                                                        {payroll.employee.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 line-clamp-1">{payroll.employee.name}</div>
                                                        <div className="text-xs text-slate-500">{payroll.employee.position}</div>
                                                    </div>
                                                </div>
                                                <Badge className={
                                                    payroll.status === 'PAID'
                                                        ? 'bg-emerald-100 text-emerald-700 border-none shadow-none'
                                                        : 'bg-amber-100 text-amber-700 border-none shadow-none'
                                                }>
                                                    {payroll.status === 'PAID' ? t.payrollDashboard.status.paid : t.payrollDashboard.status.draft}
                                                </Badge>
                                            </div>

                                            <div className="bg-slate-50 rounded-md p-3 grid grid-cols-2 gap-2 text-sm mb-3">
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">{t.payrollDashboard.table.baseSalary}</div>
                                                    <div className="font-medium text-slate-700">{formatCurrency(payroll.baseSalary)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Total {t.payrollDashboard.table.net}</div>
                                                    <div className="font-bold text-slate-900">{formatCurrency(payroll.netSalary)}</div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center text-xs">
                                                <div className="text-slate-400">{payroll.employee.department}</div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-slate-500"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Download logic placeholder
                                                        }}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPayroll(payroll);
                                                            setIsModalOpen(true);
                                                        }}
                                                    >
                                                        {t.common.detail} <ChevronRight className="h-3 w-3 ml-1" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {paginatedPayrolls.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed mx-1">
                                        {t.common.noData}.
                                    </div>
                                )}
                            </div>

                            {/* DESKTOP TABLE VIEW */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                            <th className="px-6 py-4">{t.payrollDashboard.table.employee}</th>
                                            <th className="px-6 py-4 text-right">{t.payrollDashboard.table.baseSalary}</th>
                                            <th className="px-6 py-4 text-right">{t.payrollDashboard.table.deductions}</th>
                                            <th className="px-6 py-4 text-right">{t.payrollDashboard.table.pph21}</th>
                                            <th className="px-6 py-4 text-right">{t.payrollDashboard.table.net}</th>
                                            <th className="px-6 py-4">{t.payrollDashboard.table.status}</th>
                                            <th className="px-6 py-4 text-center">{t.payrollDashboard.table.action}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {paginatedPayrolls.map((payroll) => (
                                            <tr key={payroll.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-900">{payroll.employee.name}</span>
                                                        <span className="text-xs text-slate-400 leading-tight">
                                                            {payroll.employee.department} • {payroll.employee.position}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-600 tabular-nums font-medium">
                                                    {formatCurrency(payroll.baseSalary)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-rose-500 tabular-nums font-medium">
                                                    -{formatCurrency(payroll.deductions)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-orange-500 tabular-nums font-medium">
                                                    -{formatCurrency(payroll.pph21)}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums">
                                                    <span className="font-bold text-slate-900">{formatCurrency(payroll.netSalary)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={
                                                        payroll.status === 'PAID'
                                                            ? 'bg-emerald-100 text-emerald-700 border-none shadow-none hover:bg-emerald-100'
                                                            : 'bg-amber-100 text-amber-700 border-none shadow-none hover:bg-amber-100'
                                                    }>
                                                        {payroll.status === 'PAID' ? t.payrollDashboard.status.paid : t.payrollDashboard.status.draft}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => {
                                                                setSelectedPayroll(payroll);
                                                                setIsModalOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {paginatedPayrolls.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                                                    <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                                    {t.payrollDashboard.emptyPeriod}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                    {/* Mobile Simple Controls */}
                    <div className="md:hidden w-full flex justify-between items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-8 px-3 bg-white"
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
                            className="h-8 px-3 bg-white"
                        >
                            {t.common.next} <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>

                    <div className="hidden md:block">
                        {t.common.showing} <span className="font-bold text-slate-600">{(currentPage - 1) * rowsPerPage + 1}</span> - <span className="font-bold text-slate-600">{Math.min(currentPage * rowsPerPage, filteredPayrolls.length)}</span> {t.common.of} <span className="font-bold text-slate-600">{filteredPayrolls.length}</span> {t.common.data}
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 border-slate-200"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1 || totalPages <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-1">
                            {(() => {
                                const pages = [];
                                const maxVisible = 5; // Total buttons we want to show (excluding First/Last if far)

                                if (totalPages <= 7) {
                                    // If small number of pages, show all
                                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                                } else {
                                    // Complex visual logic: 1 ... 4 5 6 ... 20

                                    // Always add first page
                                    pages.push(1);

                                    if (currentPage > 3) {
                                        pages.push('...');
                                    }

                                    // Neighbors
                                    const start = Math.max(2, currentPage - 1);
                                    const end = Math.min(totalPages - 1, currentPage + 1);

                                    for (let i = start; i <= end; i++) {
                                        if (i > 1 && i < totalPages) pages.push(i); // Avoid dupe of 1 or Last
                                    }

                                    if (currentPage < totalPages - 2) {
                                        pages.push('...');
                                    }

                                    // Always add last page
                                    pages.push(totalPages);
                                }

                                return pages.map((p, idx) => {
                                    if (p === '...') {
                                        return <span key={`ellipsis-${idx}`} className="px-2">...</span>;
                                    }
                                    const pageNum = Number(p);
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            className={cn(
                                                "h-8 w-8 p-0 border-slate-200",
                                                currentPage === pageNum ? "bg-slate-900 text-white border-slate-900" : ""
                                            )}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                });
                            })()}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 border-slate-200"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages <= 1}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Payslip Modal */}
            <PayslipModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                payroll={selectedPayroll}
            />
        </div>
    );
}
