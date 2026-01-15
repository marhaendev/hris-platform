'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { MapPin, Calendar, Search, Trash2, Filter, Users, Check, ChevronsUpDown, CheckIcon, X, Download, FileSpreadsheet, FileText as FileTextIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportToCsv, exportToExcel } from '@/lib/export';
import { useLanguage } from '@/lib/contexts/LanguageContext';
// import { DateRange } from "react-day-picker";
interface DateRange {
    from: Date | undefined;
    to?: Date | undefined;
}
import { startOfDay, endOfDay } from "date-fns";

export default function AttendancePage() {
    const user = useUser();
    const { t } = useLanguage();
    const [history, setHistory] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [todayStatus, setTodayStatus] = useState<any>(null); // null, checked-in, checked-out
    const [loading, setLoading] = useState(true);
    const [processLoading, setProcessLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Filters
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [isEmpPopoverOpen, setIsEmpPopoverOpen] = useState(false);
    const [isRolePopoverOpen, setIsRolePopoverOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchExpanded && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchExpanded]);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!isSearchExpanded) return;

        setIsSearching(true);
        const delayDebounceFn = setTimeout(() => {
            fetchData().finally(() => setIsSearching(false));
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, isSearchExpanded]);

    useEffect(() => {
        fetchData();
        if (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') {
            fetchEmployees();
        }

        // Auto-refresh mechanism
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchData();
            }
        }, 30000); // Pool every 30 seconds

        return () => clearInterval(interval);
    }, []);

    async function fetchData() {
        try {
            let url = '/api/attendance';
            const params = new URLSearchParams();
            if (dateRange?.from) {
                params.append('startDate', dateRange.from.toISOString());
            }
            if (dateRange?.to) {
                params.append('endDate', dateRange.to.toISOString());
            }
            if (selectedEmployeeIds.length > 0) {
                params.append('employeeIds', selectedEmployeeIds.join(','));
            }
            if (selectedRoles.length > 0) {
                params.append('roles', selectedRoles.join(','));
            }
            if (searchQuery) {
                params.append('search', searchQuery);
            }

            const res = await fetch(`${url}?${params.toString()}`);
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to fetch attendance');
            }
            const data = await res.json();

            setHistory(data.history || []);
            setTodayStatus(data.todayDateAttendance || null);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function fetchEmployees() {
        try {
            const res = await fetch('/api/employees');
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (err) {
            console.error("Failed to fetch employees for filter", err);
        }
    }

    const getLocation = (): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"));
            } else {
                navigator.geolocation.getCurrentPosition(resolve, (err) => {
                    reject(new Error("Gagal mengambil lokasi. Mohon izinkan akses lokasi (GPS)."));
                }, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                });
            }
        });
    };

    async function handleCheckIn() {
        setProcessLoading(true);
        try {
            const position = await getLocation();
            const { latitude, longitude } = position.coords;

            // Optional: Fetch Address via simple fetch to OpenStreetMap or just send coords
            // For now send coords

            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }
            toast.success("Check In Berhasil!");
            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setProcessLoading(false);
        }
    }

    async function handleCheckOut() {
        if (!todayStatus?.id) return;
        setProcessLoading(true);
        try {
            const res = await fetch('/api/attendance', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: todayStatus.id })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }
            toast.success("Check Out Berhasil!");
            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setProcessLoading(false);
        }
    }

    async function handleDelete(id: string) {
        setSelectedId(id);
        setDeleteConfirmOpen(true);
    }

    async function confirmDelete() {
        if (!selectedId) return;
        setProcessLoading(true);
        try {
            const res = await fetch(`/api/attendance/${selectedId}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }
            toast.success("Record absensi dihapus");
            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setProcessLoading(false);
            setDeleteConfirmOpen(false);
            setSelectedId(null);
        }
    }

    async function handleExport(format: 'csv' | 'excel') {
        setIsExporting(true);
        try {
            let url = '/api/attendance';
            const params = new URLSearchParams();
            params.append('all', 'true');
            if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());
            if (selectedEmployeeIds.length > 0) params.append('employeeIds', selectedEmployeeIds.join(','));
            if (selectedRoles.length > 0) params.append('roles', selectedRoles.join(','));
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`${url}?${params.toString()}`);
            const data = await res.json();
            const exportData = data.history || [];

            if (exportData.length === 0) {
                toast.error("Tidak ada data untuk diekspor");
                return;
            }

            const headers = [
                "Nama Karyawan",
                "Tanggal",
                "Waktu Masuk",
                "Status Masuk",
                "Lokasi Masuk",
                "Waktu Pulang",
                "Tipe Pulang",
                "Status"
            ];

            const rows = exportData.map((rec: any) => [
                rec.employeeName || '-',
                new Date(rec.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('id-ID') : '-',
                rec.checkInStatus === 'LATE' ? 'Terlambat' : (rec.checkInStatus === 'ONTIME' ? 'Tepat Waktu' : '-'),
                rec.latitude ? `https://www.google.com/maps?q=${rec.latitude},${rec.longitude}` : '-',
                rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('id-ID') : '-',
                rec.checkOutType === 'AUTO' ? 'Sistem (Auto)' : (rec.checkOut ? 'Manual' : '-'),
                'HADIR'
            ]);

            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
            const filename = `Data_Absensi_${timestamp}`;

            if (format === 'csv') {
                await exportToCsv(filename, [headers, ...rows]);
            } else {
                await exportToExcel(filename, "Absensi", [headers, ...rows]);
            }
            toast.success("Ekspor berhasil");
        } catch (err: any) {
            toast.error("Gagal mengekspor data");
        } finally {
            setIsExporting(false);
        }
    }

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

    const showCheckIn = !todayStatus;
    const showCheckOut = todayStatus && !todayStatus.checkOut;
    const finished = todayStatus && todayStatus.checkOut;

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight font-headline">Absensi Harian</h1>
                <p className="text-slate-500 mt-1 font-medium">Catat kehadiran Anda dengan lokasi yang akurat.</p>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-lg font-bold text-slate-800">Status Hari Ini</CardTitle>
                    <div className="flex flex-col items-end" suppressHydrationWarning>
                        <div className="text-2xl font-mono font-black text-primary tracking-tighter leading-none">
                            {currentTime ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {currentTime ? currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) : '---'}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {finished ? (
                        <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-100 flex items-center gap-3">
                            <span className="text-2xl">✅</span>
                            <span className="font-bold">Anda sudah selesai bekerja hari ini. Sampai jumpa besok!</span>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            {showCheckIn && (
                                <Button
                                    onClick={handleCheckIn}
                                    disabled={processLoading}
                                    size="lg"
                                    className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto font-bold shadow-lg shadow-teal-600/20"
                                >
                                    {processLoading ? 'Mendapatkan Lokasi...' : '📍 Check In (Masuk)'}
                                </Button>
                            )}
                            {showCheckOut && (
                                <Button
                                    onClick={handleCheckOut}
                                    disabled={processLoading}
                                    size="lg"
                                    className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto font-bold shadow-lg shadow-orange-500/20"
                                >
                                    {processLoading ? 'Proses...' : '👋 Check Out (Pulang)'}
                                </Button>
                            )}
                        </div>
                    )}

                    {todayStatus && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="text-blue-500 font-bold uppercase text-xs mb-1">Waktu Masuk</div>
                                <div className="text-lg font-mono font-bold text-blue-900">
                                    {new Date(todayStatus.checkIn).toLocaleTimeString()}
                                </div>
                                {todayStatus.latitude && (
                                    <a
                                        href={`https://www.google.com/maps?q=${todayStatus.latitude},${todayStatus.longitude}`}
                                        target="_blank"
                                        className="text-blue-600 hover:underline flex items-center gap-1 mt-1 text-xs"
                                    >
                                        <MapPin className="w-3 h-3" /> Lihat Lokasi
                                    </a>
                                )}
                                {todayStatus.checkInStatus === 'LATE' && (
                                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">
                                        Terlambat
                                    </div>
                                )}
                                {todayStatus.checkInStatus === 'ONTIME' && (
                                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                                        Tepat Waktu
                                    </div>
                                )}
                            </div>
                            {todayStatus.checkOut && (
                                <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                    <div className="text-orange-500 font-bold uppercase text-xs mb-1">Waktu Pulang</div>
                                    <div className="text-lg font-mono font-bold text-orange-900 leading-none">
                                        {new Date(todayStatus.checkOut).toLocaleTimeString()}
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        {todayStatus.checkOutType === 'AUTO' ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 uppercase">Sistem (Auto)</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase">Konfirmasi Manual</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-800">Riwayat Absensi</h2>
                    <div className="flex flex-wrap items-center justify-end gap-2 min-h-[40px]">
                        {/* Wrapper for standard filters - animated */}
                        <div className={cn(
                            "flex flex-wrap items-center gap-2 transition-all duration-500 ease-in-out origin-right",
                            isSearchExpanded ? "opacity-0 scale-95 pointer-events-none translate-x-10 invisible" : "opacity-100 scale-100 visible"
                        )}>
                            {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                                <>
                                    <Popover open={isEmpPopoverOpen} onOpenChange={setIsEmpPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-10 gap-2 border-slate-200 bg-white">
                                                <Users className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-medium">
                                                    {selectedEmployeeIds.length === 0
                                                        ? "Semua Karyawan"
                                                        : `${selectedEmployeeIds.length} Dipilih`}
                                                </span>
                                                <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-0 bg-white shadow-xl border-slate-200" align="end">
                                            <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                                <span className="text-xs font-bold text-slate-500 uppercase px-2">Filter Karyawan</span>
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
                                                    {selectedEmployeeIds.length === employees.length ? "Hapus Semua" : "Pilih Semua"}
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
                                                                prev.includes(id)
                                                                    ? prev.filter(i => i !== id)
                                                                    : [...prev, id]
                                                            );
                                                        }}
                                                    >
                                                        <Checkbox
                                                            id={`emp-${emp.id}`}
                                                            checked={selectedEmployeeIds.includes(emp.id.toString())}
                                                            onCheckedChange={() => { }} // Handled by div click
                                                            className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                        />
                                                        <Label
                                                            htmlFor={`emp-${emp.id}`}
                                                            className="flex-1 text-sm font-medium text-slate-700 cursor-pointer"
                                                        >
                                                            {emp.user.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                                {employees.length === 0 && (
                                                    <div className="p-4 text-center text-xs text-slate-400 italic">
                                                        Tidak ada data karyawan
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                                                <Button
                                                    className="w-full text-xs font-bold"
                                                    size="sm"
                                                    onClick={() => {
                                                        fetchData();
                                                        setIsEmpPopoverOpen(false);
                                                    }}
                                                >
                                                    Terapkan Filter
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <Popover open={isRolePopoverOpen} onOpenChange={setIsRolePopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-10 gap-2 border-slate-200 bg-white">
                                                <Filter className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-medium">
                                                    {selectedRoles.length === 0
                                                        ? "Semua Role"
                                                        : `${selectedRoles.length} Role`}
                                                </span>
                                                <ChevronsUpDown className="w-3 h-3 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-48 p-0 bg-white shadow-xl border-slate-200" align="end">
                                            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                                <span className="text-xs font-bold text-slate-500 uppercase px-2">Filter Role</span>
                                            </div>
                                            <div className="p-1">
                                                {[
                                                    { id: 'SUPERADMIN', label: 'Super Admin' },
                                                    { id: 'ADMIN', label: 'Admin' },
                                                    { id: 'EMPLOYEE', label: 'Karyawan' }
                                                ].filter(role => user?.role === 'SUPERADMIN' || role.id !== 'SUPERADMIN').map((role) => (
                                                    <div
                                                        key={role.id}
                                                        className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded-md cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedRoles(prev =>
                                                                prev.includes(role.id)
                                                                    ? prev.filter(r => r !== role.id)
                                                                    : [...prev, role.id]
                                                            );
                                                        }}
                                                    >
                                                        <Checkbox
                                                            id={`role-${role.id}`}
                                                            checked={selectedRoles.includes(role.id)}
                                                            onCheckedChange={() => { }}
                                                            className="border-slate-300"
                                                        />
                                                        <Label htmlFor={`role-${role.id}`} className="flex-1 text-sm font-medium text-slate-700 cursor-pointer">
                                                            {role.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                                                <Button
                                                    className="w-full text-xs font-bold"
                                                    size="sm"
                                                    onClick={() => {
                                                        fetchData();
                                                        setIsRolePopoverOpen(false);
                                                    }}
                                                >
                                                    Terapkan
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </>
                            )}
                            <DateRangePicker
                                date={dateRange}
                                onDateChange={(newRange) => {
                                    setDateRange(newRange);
                                }}
                            />

                            {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
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

                        {/* Animated Search Expansion Wrapper */}
                        <div className={cn(
                            "flex items-center transition-all duration-500 ease-in-out",
                            isSearchExpanded ? "flex-1 min-w-[200px]" : "w-10"
                        )}>
                            <div className={cn(
                                "flex items-center w-full bg-white border border-slate-200 rounded-lg shadow-sm transition-all duration-500 overflow-hidden h-10 px-0",
                                isSearchExpanded ? "px-3" : "border-transparent bg-transparent shadow-none"
                            )}>
                                {isSearchExpanded && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-red-500 transition-colors mr-1 shrink-0"
                                        onClick={() => {
                                            setIsSearchExpanded(false);
                                            setSearchQuery('');
                                            fetchData();
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}

                                <div className="flex-1 relative flex items-center">
                                    <Input
                                        ref={searchInputRef}
                                        placeholder="Cari nama karyawan..."
                                        className={cn(
                                            "border-none bg-transparent h-8 p-0 text-sm focus-visible:ring-0 transition-opacity duration-300 w-full",
                                            isSearchExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                                        )}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') fetchData();
                                        }}
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
                                        "h-8 w-8 transition-all shrink-0",
                                        isSearchExpanded ? "text-primary bg-primary/10 ml-2" : "text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50"
                                    )}
                                    onClick={() => {
                                        if (!isSearchExpanded) {
                                            setIsSearchExpanded(true);
                                        } else {
                                            fetchData();
                                        }
                                    }}
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama</th>
                                    )}
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Masuk</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pulang</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {history.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                        {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                                {record.employeeName || '-'}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                                            {new Date(record.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <div className="font-mono font-medium">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}</div>
                                            {record.checkInStatus === 'LATE' && <div className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">Terlambat</div>}
                                            {record.checkInStatus === 'ONTIME' && <div className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Tepat Waktu</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                            {record.latitude ? (
                                                <a
                                                    href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                                                    target="_blank"
                                                    className="flex items-center gap-1 hover:underline decoration-blue-300 underline-offset-4"
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Lihat Peta</span>
                                                </a>
                                            ) : <span className="text-slate-300 text-xs italic">No Loc</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <div className="font-mono font-medium">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}</div>
                                            {record.checkOut && (
                                                record.checkOutType === 'AUTO'
                                                    ? <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">Oleh Sistem</div>
                                                    : <div className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">Manual</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-emerald-100 text-emerald-700">
                                                HADIR
                                            </span>
                                        </td>
                                        {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-900 hover:bg-red-50"
                                                    onClick={() => handleDelete(record.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan={(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') ? 6 : 5} className="px-6 py-12 text-center text-sm text-slate-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Calendar className="w-8 h-8 text-slate-300" />
                                                <p>Tidak ada data absensi untuk periode ini.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Hapus Absensi?"
                description="Tindakan ini tidak dapat dibatalkan. Record absensi ini akan dihapus permanen dari sistem."
                confirmText="Ya, Hapus"
                onConfirm={confirmDelete}
                isLoading={processLoading}
            />
        </div>
    );
}
