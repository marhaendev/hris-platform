'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, XCircle, Clock, Paperclip, Eye, FileText, Search, Users, Filter, ChevronsUpDown, X, ChevronLeft, ChevronRight, Info, Download, FileSpreadsheet, FileText as FileTextIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportToCsv, exportToExcel } from '@/lib/export';

interface DateRange {
    from: Date | undefined;
    to?: Date | undefined;
}

export default function LeavePage() {
    const user = useUser();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'COMPANY_OWNER';

    const { t, locale } = useLanguage();

    const [leaves, setLeaves] = useState<any[]>([]);
    const [quota, setQuota] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [filterType, setFilterType] = useState('ALL');

    const handleExport = async (format: 'csv' | 'excel') => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            if (filterType !== 'ALL') params.append('type', filterType);
            if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
            if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());
            if (searchQuery) params.append('search', searchQuery);
            if (selectedEmployeeIds.length > 0) params.append('employeeIds', selectedEmployeeIds.join(','));

            // Fetch ALL data for export
            params.append('page', '1');
            params.append('limit', '1000000');

            const res = await fetch(`/api/leave?${params.toString()}`);
            const data = await res.json();
            const exportData = data.leaves || [];

            if (exportData.length === 0) {
                toast.error("Tidak ada data untuk diekspor");
                return;
            }

            const headers = [
                "Nama Karyawan",
                "Tipe Cuti",
                "Mulai",
                "Selesai",
                "Durasi (Hari)",
                "Alasan",
                "Status",
                "Disetujui Oleh"
            ];

            const rows = exportData.map((rec: any) => {
                const start = new Date(rec.startDate);
                const end = new Date(rec.endDate);
                const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                return [
                    rec.employeeName || '-',
                    getTranslatedType(rec.type),
                    start.toLocaleDateString('id-ID'),
                    end.toLocaleDateString('id-ID'),
                    diffDays,
                    rec.reason || '-',
                    rec.status === 'PENDING' ? 'Menunggu' : (rec.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'),
                    rec.approverName || '-'
                ];
            });

            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
            const filename = `Data_Cuti_${timestamp}`;

            if (format === 'csv') {
                await exportToCsv(filename, [headers, ...rows]);
            } else {
                await exportToExcel(filename, "Cuti", [headers, ...rows]);
            }
            toast.success("Ekspor berhasil");
        } catch (error) {
            toast.error("Gagal mengekspor data");
        } finally {
            setIsExporting(false);
        }
    };

    // Advanced Filters
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const shouldFilterPending = sessionStorage.getItem('filter_status_pending');
            if (shouldFilterPending === 'true') {
                return 'PENDING';
            }
        }
        return 'ALL';
    });

    useEffect(() => {
        // Clear the flag after it's been used for initialization
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('filter_status_pending');
        }
    }, []);

    const [isEmpPopoverOpen, setIsEmpPopoverOpen] = useState(false);
    const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 10;

    // Define raw types
    const rawTypes = ['ANNUAL', 'SICK', 'UNPAID', 'EMERGENCY', 'MATERNITY', 'MARRIAGE', 'BEREAVEMENT', 'DUTY', 'OTHER'];

    // Map to labels, filter out 'OTHER' for sorting, then append it at the end
    const typeLabelMap = rawTypes.map(id => ({
        id,
        label: (t.leave_mgmt.types as any)[id] || id
    }));

    const sortedNonOther = typeLabelMap
        .filter(opt => opt.id !== 'OTHER')
        .sort((a, b) => a.label.localeCompare(b.label));

    const otherOption = typeLabelMap.find(opt => opt.id === 'OTHER');
    const sortedTypeOptions = otherOption ? [...sortedNonOther, otherOption] : sortedNonOther;

    const filterOptions = [
        { id: 'ALL', label: locale === 'id' ? 'Semua' : 'All' },
        ...sortedTypeOptions
    ];

    // Form State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        type: 'ANNUAL',
        startDate: '',
        endDate: '',
        reason: '',
        attachment: '' // base64 string
    });

    const fetchLeaves = async (targetPage = currentPage, isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        else setIsRefreshing(true);
        try {
            const params = new URLSearchParams();
            if (filterType !== 'ALL') params.append('type', filterType);
            if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
            if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());
            if (searchQuery) params.append('search', searchQuery);
            if (selectedEmployeeIds.length > 0) params.append('employeeIds', selectedEmployeeIds.join(','));

            // Add pagination params
            params.append('page', targetPage.toString());
            params.append('limit', limit.toString());

            const res = await fetch(`/api/leave?${params.toString()}`);
            const data = await res.json();
            if (res.ok) {
                setLeaves(data.leaves);
                setQuota(data.quota);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                    setTotalCount(data.pagination.totalCount);
                    setCurrentPage(data.pagination.page);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            if (!isSilent) setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employees');
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (err) {
            console.error("Failed to fetch employees", err);
        }
    };

    useEffect(() => {
        if (isAdmin) fetchEmployees();
    }, [isAdmin]);

    // Fetch on filter change (Reset to Page 1)
    useEffect(() => {
        setCurrentPage(1);
        fetchLeaves(1);
    }, [filterType, selectedStatus, dateRange, selectedEmployeeIds]);

    // Search debounce (Reset to Page 1)
    useEffect(() => {
        if (!isSearchExpanded) return;
        setIsSearching(true);
        const delayDebounceFn = setTimeout(() => {
            setCurrentPage(1);
            fetchLeaves(1).finally(() => setIsSearching(false));
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, isSearchExpanded]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            fetchLeaves(newPage);
            // Scroll to top of list if on mobile
            if (window.innerWidth < 768) {
                const listEl = document.getElementById('leave-history-list');
                listEl?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    // Auto-refresh logic (Realtime 1s)
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                // Poll every 1s if Admin/Owner (to see requests)
                // Or if it's an employee (to see status changes)
                fetchLeaves(currentPage, true);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentPage, filterType, selectedStatus, dateRange, selectedEmployeeIds, searchQuery, isSearchExpanded]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast.success(t.leave_mgmt.form.success);
                setFormData({ type: 'ANNUAL', startDate: '', endDate: '', reason: '', attachment: '' });
                fetchLeaves();
            } else {
                const err = await res.json();
                toast.error(err.error || t.leave_mgmt.form.error);
            }
        } catch (e) {
            toast.error(t.common.error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setFormData(prev => ({ ...prev, attachment: '' }));
            return;
        }

        // Limit size to 2MB
        if (file.size > 2 * 1024 * 1024) {
            toast.error(locale === 'id' ? 'Ukuran file maksimal 2MB' : 'Max file size is 2MB');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, attachment: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleAction = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await fetch(`/api/leave/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                const actionLabel = status === 'APPROVED' ? t.leave_mgmt.list.action.approve : t.leave_mgmt.list.action.reject;
                toast.success(t.leave_mgmt.list.action.success.replace('{action}', actionLabel.toLowerCase()));
                fetchLeaves();
            }
        } catch (e) {
            toast.error(t.leave_mgmt.list.action.error);
        }
    };

    const getStatusBadge = (leave: any) => {
        const badge = (() => {
            switch (leave.status) {
                case 'APPROVED': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle className="w-3 h-3" /> {t.leave_mgmt.status.APPROVED}</span>;
                case 'REJECTED': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold"><XCircle className="w-3 h-3" /> {t.leave_mgmt.status.REJECTED}</span>;
                default: return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs font-bold"><Clock className="w-3 h-3" /> {t.leave_mgmt.status.PENDING}</span>;
            }
        })();

        if (leave.status !== 'PENDING' && leave.approverName) {
            return (
                <div className="flex items-center gap-1.5">
                    {badge}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-200">
                                <Info className="w-3.5 h-3.5" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 text-[11px] font-medium bg-white shadow-lg border-slate-200" side="top">
                            <div className="space-y-1">
                                <p className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">
                                    {leave.status === 'APPROVED' ? (locale === 'id' ? 'DISETUJUI OLEH' : 'APPROVED BY') : (locale === 'id' ? 'DITOLAK OLEH' : 'REJECTED BY')}
                                </p>
                                <p className="text-slate-900 font-bold">{leave.approverName}</p>
                                <p className="text-slate-400 text-[10px]">
                                    {new Date(leave.updatedAt).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            );
        }

        return badge;
    };

    const getTranslatedType = (type: string) => {
        if (!type) return '';
        const norm = type.trim().toUpperCase();
        return (t.leave_mgmt.types as any)[norm] || type;
    };



    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 font-headline">{t.leave_mgmt.title}</h1>
                    <p className="text-slate-500">{t.leave_mgmt.subtitle}</p>
                </div>
            </div>

            {/* Quota Summary Cards */}
            {quota && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50/50 border-blue-100 shadow-sm transition-transform hover:scale-[1.02]">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{locale === 'id' ? 'Kuota Tahunan' : 'Annual Balance'}</p>
                                <p className="text-2xl font-black text-blue-900 mt-1">{quota.annualQuota} <span className="text-sm font-medium text-blue-400">{locale === 'id' ? 'hari' : 'days'}</span></p>
                            </div>
                            <div className="bg-blue-100 p-2.5 rounded-xl">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-orange-50/50 border-orange-100 shadow-sm transition-transform hover:scale-[1.02]">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">{locale === 'id' ? 'Cuti Terpakai' : 'Used Leave'}</p>
                                <p className="text-2xl font-black text-orange-900 mt-1">{quota.usedQuota} <span className="text-sm font-medium text-orange-400">{locale === 'id' ? 'hari' : 'days'}</span></p>
                            </div>
                            <div className="bg-orange-100 p-2.5 rounded-xl">
                                <Clock className="w-5 h-5 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50/50 border-green-100 shadow-sm transition-transform hover:scale-[1.02]">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-green-600 uppercase tracking-wider">{locale === 'id' ? 'Sisa Kuota' : 'Remaining'}</p>
                                <p className="text-2xl font-black text-green-900 mt-1">{quota.remainingQuota} <span className="text-sm font-medium text-green-400">{locale === 'id' ? 'hari' : 'days'}</span></p>
                            </div>
                            <div className="bg-green-100 p-2.5 rounded-xl">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="space-y-8">
                {/* Form Pengajuan (Only for Employee or Admin acting as Employee) */}
                <div className="w-full">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-slate-800">{t.leave_mgmt.form.title}</CardTitle>
                            <CardDescription>{t.leave_mgmt.form.desc}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t.leave_mgmt.form.type}</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(val) => setFormData({ ...formData, type: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sortedTypeOptions.map(opt => (
                                                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t.leave_mgmt.form.startDate}</Label>
                                        <Input
                                            type="date"
                                            required
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t.leave_mgmt.form.endDate}</Label>
                                        <Input
                                            type="date"
                                            required
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.leave_mgmt.form.reason}</Label>
                                    <Input
                                        placeholder={t.leave_mgmt.form.reasonPlaceholder}
                                        required
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{locale === 'id' ? 'Lampiran Bukti (Opsional)' : 'Evidence Attachment (Optional)'}</Label>
                                    <Input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={handleFileChange}
                                        className="cursor-pointer"
                                    />
                                    <p className="text-[10px] text-slate-400">
                                        {locale === 'id' ? '* Format: JPG/PNG/PDF. Maks 2MB.' : '* Format: JPG/PNG/PDF. Max 2MB.'}
                                    </p>
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {isSubmitting ? t.leave_mgmt.form.submitting : t.leave_mgmt.form.submit}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* List Riwayat */}
                <div className="w-full space-y-4">
                    <Card>
                        <CardHeader className="py-3 border-b">
                            <div className="flex items-baseline gap-3">
                                <CardTitle className="text-slate-800 text-lg">{isAdmin ? t.leave_mgmt.list.titleAdmin : t.leave_mgmt.list.titleUser}</CardTitle>
                                {isAdmin && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100/50">
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full bg-emerald-500",
                                            isRefreshing ? "animate-ping" : "animate-pulse"
                                        )} />
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {/* Filter Tipe Cuti (Filter Chips) */}
                            <div className="flex flex-wrap gap-2">
                                {filterOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setFilterType(opt.id)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                                            filterType === opt.id
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:bg-slate-50"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {/* Advanced Filters & Search (Placed Below Tabs) */}
                            <div className="flex flex-wrap items-center justify-end gap-2 min-h-[40px] w-full">
                                {/* Standard Filters Wrapper */}
                                <div className={cn(
                                    "flex flex-wrap items-center gap-2 transition-all duration-500 ease-in-out origin-right w-full md:w-auto",
                                    isSearchExpanded ? "opacity-0 scale-95 pointer-events-none translate-x-10 invisible" : "opacity-100 scale-100 visible"
                                )}>
                                    {isAdmin && (
                                        <Popover open={isEmpPopoverOpen} onOpenChange={setIsEmpPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 bg-white">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs font-medium">
                                                        {selectedEmployeeIds.length === 0
                                                            ? (locale === 'id' ? "Semua Karyawan" : "All Employees")
                                                            : `${selectedEmployeeIds.length} ${locale === 'id' ? 'Dipilih' : 'Selected'}`}
                                                    </span>
                                                    <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-0 bg-white shadow-xl border-slate-200" align="end">
                                                <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase px-2">{locale === 'id' ? 'Filter Karyawan' : 'Filter Employee'}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-[10px] h-6 px-2 font-bold text-primary hover:text-primary hover:bg-primary/5"
                                                        onClick={() => {
                                                            if (selectedEmployeeIds.length === employees.length) {
                                                                setSelectedEmployeeIds([]);
                                                            } else {
                                                                setSelectedEmployeeIds(employees.map(e => e.id.toString()));
                                                            }
                                                        }}
                                                    >
                                                        {selectedEmployeeIds.length === employees.length ? (locale === 'id' ? "Hapus" : "Clear") : (locale === 'id' ? "Semua" : "All")}
                                                    </Button>
                                                </div>
                                                <div className="max-h-64 overflow-y-auto p-1">
                                                    {employees.map((emp) => (
                                                        <div
                                                            key={emp.id}
                                                            className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded-md cursor-pointer transition-colors"
                                                            onClick={() => {
                                                                const id = emp.id.toString();
                                                                setSelectedEmployeeIds(prev =>
                                                                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                                                                );
                                                            }}
                                                        >
                                                            <Checkbox
                                                                checked={selectedEmployeeIds.includes(emp.id.toString())}
                                                                className="border-slate-300"
                                                            />
                                                            <Label className="flex-1 text-xs font-medium text-slate-700 cursor-pointer">
                                                                {emp.user.name}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}

                                    <Popover open={isStatusPopoverOpen} onOpenChange={setIsStatusPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 bg-white">
                                                <Filter className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-medium">
                                                    {selectedStatus === 'ALL' ? (locale === 'id' ? 'Semua Status' : 'All Status') : t.leave_mgmt.status[selectedStatus as keyof typeof t.leave_mgmt.status]}
                                                </span>
                                                <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-40 p-1 bg-white shadow-xl border-slate-200" align="end">
                                            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                                                <button
                                                    key={s}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors",
                                                        selectedStatus === s ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50"
                                                    )}
                                                    onClick={() => {
                                                        setSelectedStatus(s);
                                                        setIsStatusPopoverOpen(false);
                                                    }}
                                                >
                                                    {s === 'ALL' ? (locale === 'id' ? 'Semua Status' : 'All Status') : t.leave_mgmt.status[s as keyof typeof t.leave_mgmt.status]}
                                                </button>
                                            ))}
                                        </PopoverContent>
                                    </Popover>

                                    <DateRangePicker
                                        date={dateRange}
                                        onDateChange={(newRange) => {
                                            setDateRange(newRange);
                                        }}
                                    />

                                    {isAdmin && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-10 gap-2 border-slate-200 bg-white"
                                                    disabled={isExporting}
                                                >
                                                    <Download className={cn("w-4 h-4 text-slate-400", isExporting && "animate-bounce")} />
                                                    <span className="text-sm font-medium">{isExporting ? t.common.loading : t.common.export}</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2 cursor-pointer">
                                                    <FileTextIcon className="w-4 h-4 text-slate-400" />
                                                    <span>{t.common.downloadCsv}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-2 cursor-pointer">
                                                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                                                    <span>{t.common.downloadExcel}</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>

                                {/* Expandable Search Bar */}
                                <div className={cn(
                                    "flex items-center transition-all duration-500 ease-in-out",
                                    isSearchExpanded ? "flex-1 min-w-[200px]" : "w-10"
                                )}>
                                    <div className={cn(
                                        "flex items-center w-full bg-white border border-slate-200 rounded-lg shadow-sm transition-all duration-500 overflow-hidden h-9 px-0",
                                        isSearchExpanded ? "px-2" : "border-transparent bg-transparent shadow-none"
                                    )}>
                                        {isSearchExpanded && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-slate-400 hover:text-red-500 transition-colors mr-1 shrink-0"
                                                onClick={() => {
                                                    setIsSearchExpanded(false);
                                                    setSearchQuery('');
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <div className="flex-1 relative flex items-center">
                                            <Input
                                                ref={searchInputRef}
                                                placeholder={isAdmin ? (locale === 'id' ? 'Cari nama atau alasan...' : 'Search name or reason...') : (locale === 'id' ? 'Cari alasan cuti...' : 'Search reason...')}
                                                className={cn(
                                                    "border-none bg-transparent h-7 p-0 text-xs focus-visible:ring-0 transition-opacity duration-300 w-full",
                                                    isSearchExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                                                )}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                            {isSearching && (
                                                <div className="absolute right-0 animate-spin">
                                                    <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-7 w-7 transition-all shrink-0",
                                                isSearchExpanded ? "text-primary bg-primary/10 ml-1" : "text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50"
                                            )}
                                            onClick={() => {
                                                if (!isSearchExpanded) {
                                                    setIsSearchExpanded(true);
                                                } else {
                                                    fetchLeaves();
                                                }
                                            }}
                                        >
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Top Pagination Controls */}
                            {totalCount > 0 && (
                                <div className={cn("flex flex-col sm:flex-row items-center justify-between py-3 border-y border-slate-50 gap-4 transition-opacity", isLoading ? "opacity-50 pointer-events-none" : "opacity-100")}>
                                    <p className="text-xs text-slate-500 font-medium tracking-tight">
                                        {locale === 'id' ? `Halaman ${currentPage} dari ${totalPages || 1} (Total ${totalCount})` : `Page ${currentPage} of ${totalPages || 1} (Total ${totalCount})`}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 border-slate-200 bg-white"
                                            disabled={currentPage === 1 || isLoading}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                        >
                                            <ChevronLeft className="h-4 w-4 text-slate-400" />
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum = i + 1;
                                                if (totalPages > 5 && currentPage > 3) {
                                                    pageNum = currentPage - 2 + i;
                                                    if (pageNum + (5 - i - 1) > totalPages) {
                                                        pageNum = totalPages - 5 + i + 1;
                                                    }
                                                }
                                                if (pageNum <= 0) return null;
                                                if (pageNum > totalPages) return null;

                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={currentPage === pageNum ? "default" : "outline"}
                                                        size="sm"
                                                        className={cn(
                                                            "h-8 w-8 p-0 text-xs font-bold transition-all",
                                                            currentPage === pageNum
                                                                ? "bg-primary text-white border-primary shadow-sm"
                                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        )}
                                                        disabled={isLoading}
                                                        onClick={() => handlePageChange(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 border-slate-200 bg-white"
                                            disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                        >
                                            <ChevronRight className="h-4 w-4 text-slate-400" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {isLoading ? (
                                <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
                                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                    <p className="text-sm text-slate-500 font-medium italic">{t.common.loading}</p>
                                </div>
                            ) : leaves.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50/50">
                                    <p className="text-slate-500 font-medium">{t.leave_mgmt.list.empty}</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {filterType === 'ALL'
                                            ? (locale === 'id' ? 'Belum ada data riwayat pengajuan.' : 'No application history yet.')
                                            : (locale === 'id' ? `Tidak ada data untuk kategori ${filterOptions.find(o => o.id === filterType)?.label}` : `No data for category ${filterOptions.find(o => o.id === filterType)?.label}`)}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2" id="leave-history-list">
                                    {leaves.map((leave) => (
                                        <div key={leave.id} className="flex flex-col md:flex-row md:items-center justify-between py-2.5 px-3 border rounded-lg bg-slate-50/50 gap-3 transition-colors hover:bg-slate-100/50">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                    <span className="font-bold text-slate-900 text-sm">
                                                        {getTranslatedType(leave.type)}
                                                    </span>
                                                    {getStatusBadge(leave)}
                                                    {leave.attachment && (
                                                        <a
                                                            href={`/preview/${leave.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-[9px] text-primary hover:underline font-bold bg-primary/5 px-1.5 py-0 rounded border border-primary/20"
                                                            title={locale === 'id' ? 'Lihat Lampiran' : 'View Attachment'}
                                                        >
                                                            <Paperclip className="h-2.5 w-2.5" />
                                                            {locale === 'id' ? 'Lampiran' : 'Attachment'}
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                                    <p className="text-xs font-medium text-slate-700">
                                                        {new Date(leave.startDate).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 truncate">
                                                        <span className="font-semibold text-slate-400">{leave.employeeName}</span> • {leave.reason}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons for Admin */}
                                            {isAdmin && leave.status === 'PENDING' && (
                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" variant="destructive" onClick={() => handleAction(leave.id, 'REJECTED')}>{t.leave_mgmt.list.action.reject}</Button>
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction(leave.id, 'APPROVED')}>{t.leave_mgmt.list.action.approve}</Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Bottom Pagination Controls */}
                            {totalCount > 0 && (
                                <div className={cn("flex flex-col sm:flex-row items-center justify-between pt-4 border-t gap-4 transition-opacity", isLoading ? "opacity-50 pointer-events-none" : "opacity-100")}>
                                    <p className="text-xs text-slate-500 font-medium tracking-tight">
                                        {locale === 'id' ? `Halaman ${currentPage} dari ${totalPages || 1} (Total ${totalCount})` : `Page ${currentPage} of ${totalPages || 1} (Total ${totalCount})`}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 border-slate-200 bg-white"
                                            disabled={currentPage === 1 || isLoading}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                        >
                                            <ChevronLeft className="h-4 w-4 text-slate-400" />
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum = i + 1;
                                                if (totalPages > 5 && currentPage > 3) {
                                                    pageNum = currentPage - 2 + i;
                                                    if (pageNum + (5 - i - 1) > totalPages) {
                                                        pageNum = totalPages - 5 + i + 1;
                                                    }
                                                }
                                                if (pageNum <= 0) return null;
                                                if (pageNum > totalPages) return null;

                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={currentPage === pageNum ? "default" : "outline"}
                                                        size="sm"
                                                        className={cn(
                                                            "h-8 w-8 p-0 text-xs font-bold transition-all",
                                                            currentPage === pageNum
                                                                ? "bg-primary text-white border-primary shadow-sm hover:bg-primary/90"
                                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                                                        )}
                                                        disabled={isLoading} onClick={() => handlePageChange(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 border-slate-200 bg-white"
                                            disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                        >
                                            <ChevronRight className="h-4 w-4 text-slate-400" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
