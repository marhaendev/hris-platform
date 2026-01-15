'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import {
    UserCircle,
    Mail,
    Calendar,
    ChevronLeft,
    Edit,
    KeyRound,
    Trash2,
    Building2,
    ShieldCheck
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLanguage } from '@/lib/contexts/LanguageContext';
import Link from 'next/link';

export default function OwnerDetailPage({ params }: { params: { id: string } }) {
    const [owner, setOwner] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [logs, setLogs] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>({});

    const [currentUser, setCurrentUser] = useState<any>(null);

    // Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteMode, setDeleteMode] = useState<'SINGLE' | 'ALL'>('SINGLE');
    const [deleteLogId, setDeleteLogId] = useState<number | null>(null);

    const { t } = useLanguage();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Current User (Me)
                const meRes = await fetch('/api/user/profile');
                if (meRes.ok) setCurrentUser(await meRes.json());

                // Fetch Owners
                const res = await fetch('/api/owners');
                const data = await res.json();
                const found = data.find((a: any) => a.id.toString() === params.id);
                setOwner(found);

                // Fetch Logs (Paginated)
                const logRes = await fetch(`/api/activity-logs?userId=${params.id}&page=${page}&limit=5`);
                const logData = await logRes.json();

                if (logData.logs) {
                    setLogs(logData.logs);
                    setPagination(logData.pagination);
                } else if (Array.isArray(logData)) {
                    setLogs(logData);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id, page]);

    const triggerDeleteLog = (logId: number) => {
        setDeleteMode('SINGLE');
        setDeleteLogId(logId);
        setDeleteDialogOpen(true);
    };

    const triggerDeleteAllLogs = () => {
        setDeleteMode('ALL');
        setDeleteLogId(null);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            let res;
            if (deleteMode === 'SINGLE' && deleteLogId) {
                res = await fetch(`/api/activity-logs?id=${deleteLogId}`, { method: 'DELETE' });
            } else if (deleteMode === 'ALL') {
                res = await fetch(`/api/activity-logs?userId=${params.id}`, { method: 'DELETE' });
            }

            if (res && res.ok) {
                const data = await res.json();
                toast.success(deleteMode === 'ALL' ? t.userDetail.toast.logsDeleted.replace('{count}', data.count) : t.userDetail.toast.logDeleted);

                // Refresh Logs
                const logRes = await fetch(`/api/activity-logs?userId=${params.id}&page=${page}&limit=5`);
                const logData = await logRes.json();
                if (logData.logs) {
                    setLogs(logData.logs);
                    setPagination(logData.pagination);
                } else {
                    setLogs([]);
                    setPagination({});
                }
                setDeleteDialogOpen(false);
            } else {
                toast.error(t.userDetail.toast.deleteFailed);
            }
        } catch (error) {
            console.error(error);
            toast.error(t.userDetail.toast.error);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">{t?.common?.loading || 'Memuat...'}</div>;
    if (!owner) return (
        <div className="p-8 text-center space-y-4">
            <p className="text-red-500">Owner tidak ditemukan.</p>
            <Button variant="outline" onClick={() => router.push('/dashboard/users/owner')}>Kembali</Button>
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/users/owner"><ChevronLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">{owner.name}</h1>
                        <p className="text-slate-500">Profil Pemilik Perusahaan</p>
                    </div>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90 font-bold">
                    <Link href={`/dashboard/users/owner/${params.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Profil
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Info */}
                <Card className="md:col-span-1 shadow-sm h-fit">
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4 bg-amber-100 text-amber-700">
                            <AvatarFallback className="text-2xl font-bold">
                                {owner.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="text-lg font-bold text-slate-900">{owner.name}</h2>
                        <div className="text-sm text-slate-500 mb-4">{owner.email}</div>

                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 mb-4">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Company Owner
                        </Badge>

                        <div className="w-full pt-4 border-t border-slate-100 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider justify-center">
                                <Building2 className="h-3 w-3" /> Perusahaan
                            </div>
                            <div className="text-sm font-bold text-slate-700">{owner.companyName}</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content Tabs */}
                <div className="md:col-span-3">
                    <Tabs defaultValue="profile">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 p-1">
                            <TabsTrigger value="profile">Profil Akun</TabsTrigger>
                            <TabsTrigger value="activity">Aktivitas</TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="mt-4">
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader>
                                    <CardTitle className="text-lg">Informasi Owner</CardTitle>
                                    <CardDescription>Detail profil pemilik perusahaan.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Nama Lengkap</Label>
                                            <div className="flex items-center gap-2 font-medium text-slate-800">
                                                <UserCircle className="h-4 w-4 text-slate-400" /> {owner.name}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Email Login</Label>
                                            <div className="flex items-center gap-2 font-medium text-slate-800">
                                                <Mail className="h-4 w-4 text-slate-400" /> {owner.email}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Role Sistem</Label>
                                            <div className="flex items-center gap-2 font-medium text-slate-800">
                                                <KeyRound className="h-4 w-4 text-slate-400" /> Company Owner
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Terdaftar Sejak</Label>
                                            <div className="flex items-center gap-2 font-medium text-slate-800">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                {owner.createdAt ? new Date(owner.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="activity" className="mt-4">
                            <Card className="shadow-sm border-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex flex-col space-y-1.5">
                                        <CardTitle className="text-lg">Log Aktivitas</CardTitle>
                                        <CardDescription>Riwayat aktivitas akun ini.</CardDescription>
                                    </div>
                                    {currentUser?.role === 'SUPERADMIN' && logs.length > 0 && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-8 font-bold"
                                            onClick={triggerDeleteAllLogs}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Hapus Semua
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {logs.length > 0 ? (
                                            <>
                                                {logs.map((log: any) => (
                                                    <div key={log.id} className="group flex items-start justify-between gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                                        <div className="flex items-start gap-4">
                                                            <div className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-medium text-slate-900">{log.description || log.action}</p>
                                                                <p className="text-xs text-slate-400 font-mono">
                                                                    {new Date(log.createdAt).toLocaleString('id-ID', {
                                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                                        hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {currentUser?.role === 'SUPERADMIN' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => triggerDeleteLog(log.id)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}

                                                {/* Pagination Controls */}
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                                        disabled={page === 1}
                                                    >
                                                        Kembali
                                                    </Button>
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        Halaman {page} dari {pagination.totalPages || 1}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                                        disabled={page >= (pagination.totalPages || 1)}
                                                    >
                                                        Lanjut
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-12 text-slate-400">
                                                <p className="italic">Belum ada data aktivitas yang terekam.</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Penghapusan</DialogTitle>
                        <DialogDescription>
                            {deleteMode === 'ALL'
                                ? "Apakah Anda yakin ingin menghapus SEMUA log aktivitas user ini? Tindakan ini tidak dapat dibatalkan."
                                : "Apakah Anda yakin ingin menghapus log aktivitas ini?"
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
