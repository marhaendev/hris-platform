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
    Search as SearchIcon
} from 'lucide-react';
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

export default function PayrollDashboard() {
    const router = useRouter();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Modal State
    const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        fetchPayrolls();
        setCurrentPage(1); // Reset to first page when month/year changes
    }, [month, year]);

    async function fetchPayrolls() {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/payroll?month=${month}&year=${year}`);
            const data = await res.json();
            if (res.ok) {
                setPayrolls(data);
            } else {
                toast.error(data.error || 'Failed to fetch payrolls');
            }
        } catch (err) {
            toast.error('Connection error');
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
            toast.error('Failed to generate payroll');
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

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Penggajian</h1>
                    <p className="text-slate-500 mt-1">Kelola gaji, pajak PPh21, dan slip gaji karyawan.</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                        <SelectTrigger className="w-[140px] border-none focus:ring-0">
                            <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                            <SelectValue placeholder="Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="w-px h-6 bg-slate-200" />

                    <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                        <SelectTrigger className="w-[100px] border-none focus:ring-0">
                            <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="w-px h-6 bg-slate-200" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        onClick={() => router.push('/dashboard/payroll/settings')}
                    >
                        <Settings2 className="h-5 w-5" />
                    </Button>

                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        Proses Gaji
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Pembayaran Netto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalNet)}</div>
                        <div className="flex items-center mt-2 text-emerald-400 text-xs font-medium">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            Gaji bersih seluruh karyawan
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total PPh21 Terhutang</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalPPh21)}</div>
                        <div className="flex items-center mt-2 text-amber-500 text-xs font-medium">
                            <FileText className="h-3 w-3 mr-1" />
                            Estimasi pajak bulan ini
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Jumlah Karyawan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{totalEmployees}</div>
                        <div className="flex items-center mt-2 text-blue-500 text-xs font-medium">
                            <User className="h-3 w-3 mr-1" />
                            Diterima oleh {totalEmployees} orang
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Ceri nama atau departemen..."
                            className="pl-10 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="gap-2 text-slate-600 border-slate-200">
                            <Download className="h-4 w-4" />
                            Export Excel
                        </Button>
                        <Button variant="outline" className="gap-2 text-slate-600 border-slate-200">
                            <Printer className="h-4 w-4" />
                            Cetak Semua Slip
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-sm font-medium">Memuat data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">Karyawan</th>
                                    <th className="px-6 py-4 text-right">Gaji Pokok</th>
                                    <th className="px-6 py-4 text-right">Potongan</th>
                                    <th className="px-6 py-4 text-right">PPh21</th>
                                    <th className="px-6 py-4 text-right">Netto</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
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
                                                {payroll.status === 'PAID' ? 'Selesai' : 'Draf'}
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
                                            Belum ada data untuk periode ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                    <div>
                        Menampilkan <span className="font-bold text-slate-600">{(currentPage - 1) * rowsPerPage + 1}</span> - <span className="font-bold text-slate-600">{Math.min(currentPage * rowsPerPage, filteredPayrolls.length)}</span> dari <span className="font-bold text-slate-600">{filteredPayrolls.length}</span> catatan
                    </div>

                    <div className="flex items-center gap-2">
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
                            {totalPages <= 1 ? (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-8 w-8 p-0 bg-slate-900 text-white border-slate-900"
                                    disabled
                                >
                                    1
                                </Button>
                            ) : (
                                Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <Button
                                        key={p}
                                        variant={currentPage === p ? "default" : "outline"}
                                        size="sm"
                                        className={cn(
                                            "h-8 w-8 p-0 border-slate-200",
                                            currentPage === p ? "bg-slate-900 text-white border-slate-900" : ""
                                        )}
                                        onClick={() => setCurrentPage(p)}
                                    >
                                        {p}
                                    </Button>
                                ))
                            )}
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
