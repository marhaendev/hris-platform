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

    const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

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
        if (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'COMPANY_OWNER') {
            fetchEmployees();
        }

        // Auto-refresh mechanism (Real-time update for Admins/Owners)
        const interval = setInterval(() => {
            const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'COMPANY_OWNER';
            // Only auto-refresh for admins or if employee hasn't finished today
            if (document.visibilityState === 'visible') {
                if (isAdmin || !todayStatus?.checkOut) {
                    fetchData(true);
                }
            }
        }, 1000); // Poll every 1 second for "instant" updates. High frequency but light queries.

        return () => clearInterval(interval);
    }, [user?.role, todayStatus?.checkOut]);

    async function fetchData(isSilent: boolean = false) {
        if (!isSilent) setLoading(true);
        else setIsRefreshing(true);

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
            setLastFetchTime(new Date());
        } catch (err: any) {
            if (!isSilent) toast.error(err.message);
            else console.error("Silent refresh failed:", err.message);
        } finally {
            if (!isSilent) setLoading(false);
            setIsRefreshing(false);
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
                reject(new Error("Browser Anda tidak mendukung fitur lokasi (GPS)."));
            } else {
                // Check for Secure Context (HTTPS)
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                if (window.isSecureContext === false && !isLocal) {
                    reject(new Error("Akses lokasi (GPS) ditolak karena koneksi tidak aman (HTTP). Mohon gunakan HTTPS atau buka di Localhost."));
                    return;
                }

                navigator.geolocation.getCurrentPosition(resolve, (err) => {
                    let msg = "Gagal mengambil lokasi.";
                    if (err.code === 1) { // PERMISSION_DENIED
                        if (window.isSecureContext === false && !isLocal) {
                            msg = "Izin lokasi otomatis ditolak oleh browser karena Anda mengakses via HTTP (bukan HTTPS). Fitur ini wajib menggunakan koneksi aman.";
                        } else {
                            msg = "Izin lokasi ditolak. Mohon izinkan akses lokasi dengan mengklik ikon gembok 🔒 di url bar, lalu setel Lokasi ke 'Izinkan/Allow', kemudian Refresh halaman.";
                        }
                    } else if (err.code === 2) { // POSITION_UNAVAILABLE
                        msg = "Posisi tidak tersedia. Pastikan GPS Anda aktif dan memiliki sinyal yang cukup.";
                    } else if (err.code === 3) { // TIMEOUT
                        msg = "Waktu permintaan lokasi habis. Silakan coba lagi.";
                    }
                    reject(new Error(msg));
                }, {
                    enableHighAccuracy: true,
                    timeout: 20000,
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
                console.error("Delete failed:", data);
                throw new Error(data.error || "Gagal menghapus data");
            }
            toast.success("Record absensi berhasil dihapus");
            // Optimistic/Local state update instead of full fetchData
            setHistory(prev => prev.filter(item => item.id.toString() !== selectedId));
            if (todayStatus?.id.toString() === selectedId) {
                setTodayStatus(null);
            }
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
        <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6 animate-fade-in">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight font-headline">Absensi Harian</h1>
                <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium italic">Catat kehadiran Anda dengan lokasi yang akurat.</p>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-3 md:py-4 px-4 md:px-6">
                    <CardTitle className="text-sm md:text-lg font-bold text-slate-800 uppercase tracking-wider md:normal-case">Status Hari Ini</CardTitle>
                    <div className="flex flex-col items-end shrink-0" suppressHydrationWarning>
                        <div className="text-2xl font-mono font-black text-primary tracking-tighter leading-none">
                            {currentTime ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {currentTime ? currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) : '---'}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
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
                                    className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto font-bold shadow-lg shadow-teal-600/20 h-14 md:h-11"
                                >
                                    {processLoading ? 'Mendapatkan Lokasi...' : '📍 Check In (Masuk)'}
                                </Button>
                            )}
                            {showCheckOut && (
                                <Button
                                    onClick={handleCheckOut}
                                    disabled={processLoading}
                                    size="lg"
                                    className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto font-bold shadow-lg shadow-orange-500/20 h-14 md:h-11"
                                >
                                    {processLoading ? 'Proses...' : '👋 Check Out (Pulang)'}
                                </Button>
                            )}
                        </div>
                    )}

                    {todayStatus && (
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 uppercase tracking-tight md:normal-case">Riwayat Absensi</h2>
                        {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'COMPANY_OWNER') && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                                <span className={cn(
                                    "w-1.5 h-1.5 rounded-full bg-emerald-500",
                                    isRefreshing ? "animate-ping" : "animate-pulse"
                                )} />
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 w-full md:w-auto min-h-[40px]">
                        {/* Wrapper for standard filters - animated */}
                        <div className={cn(
                            "flex flex-wrap items-center gap-2 transition-all duration-500 ease-in-out origin-right",
                            isSearchExpanded ? "opacity-0 scale-95 pointer-events-none translate-x-10 invisible" : "opacity-100 scale-100 visible"
                        )}>
                            {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'COMPANY_OWNER') && (
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
                                                    { id: 'COMPANY_OWNER', label: 'Owner' },
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
                            <div className="w-full sm:w-auto flex-1 sm:flex-none">
                                <DateRangePicker
                                    date={dateRange}
                                    onDateChange={(newRange) => {
                                        setDateRange(newRange);
                                    }}
                                />
                            </div>

                            {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'COMPANY_OWNER') && (
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

                {/* Desktop View: Table */}
                <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'COMPANY_OWNER') && (
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama</th>
                                    )}
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Masuk</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pulang</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'COMPANY_OWNER') && (
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {history.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                        {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'COMPANY_OWNER') && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                                {record.employeeName || '-'}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                                            {new Date(record.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <div className="font-mono font-bold text-slate-700">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                            {record.checkInStatus === 'LATE' && <div className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">Terlambat</div>}
                                            {record.checkInStatus === 'ONTIME' && <div className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Tepat Waktu</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                            {record.latitude ? (
                                                <a
                                                    href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                                                    target="_blank"
                                                    className="flex items-center gap-1 hover:underline decoration-blue-300 underline-offset-4 font-bold"
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                    <span>Lihat Peta</span>
                                                </a>
                                            ) : <span className="text-slate-300 text-xs italic">No Loc</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <div className="font-mono font-bold text-slate-700">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                            {record.checkOut && (
                                                record.checkOutType === 'AUTO'
                                                    ? <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Oleh Sistem</div>
                                                    : <div className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">Manual</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-emerald-100 text-emerald-700">
                                                HADIR
                                            </span>
                                        </td>
                                        {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'COMPANY_OWNER') && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg h-8 w-8 p-0"
                                                    onClick={() => handleDelete(record.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile View: Card List */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {history.map((record) => (
                        <Card key={record.id} className="border-slate-200 overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'COMPANY_OWNER') && (
                                            <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                                {record.employeeName || 'Tanpa Nama'}
                                            </div>
                                        )}
                                        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(record.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </div>
                                    </div>
                                    {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'COMPANY_OWNER') && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 h-8 w-8 p-0 hover:bg-red-50"
                                            onClick={() => handleDelete(record.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Masuk</div>
                                        <div className="text-sm font-mono font-bold text-slate-700">
                                            {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </div>
                                        {record.checkInStatus === 'LATE' && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase">Telat</span>}
                                        {record.checkInStatus === 'ONTIME' && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">OK</span>}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Pulang</div>
                                        <div className="text-sm font-mono font-bold text-slate-700 text-right">
                                            {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </div>
                                        <div className="flex justify-end">
                                            {record.checkOut && (
                                                record.checkOutType === 'AUTO'
                                                    ? <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase italic">Auto</span>
                                                    : <span className="text-[9px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded uppercase">Manual</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-1">
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-tighter">HADIR</span>
                                    {record.latitude && (
                                        <a
                                            href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                                            target="_blank"
                                            className="text-xs font-bold text-blue-600 flex items-center gap-1 active:opacity-60"
                                        >
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>Lihat Lokasi</span>
                                        </a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {history.length === 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 italic">
                        <div className="flex flex-col items-center gap-2">
                            <Calendar className="w-8 h-8 text-slate-200" />
                            <p className="text-sm">Tidak ada data absensi untuk periode ini.</p>
                        </div>
                    </div>
                )}
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
