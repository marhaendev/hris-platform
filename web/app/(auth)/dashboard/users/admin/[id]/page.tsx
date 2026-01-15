'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { ShieldCheck, Mail, Calendar, ChevronLeft, Edit, User, KeyRound, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLanguage } from '@/lib/contexts/LanguageContext';
import Link from 'next/link';

export default function AdminDetailPage({ params }: { params: { id: string } }) {
    const [admin, setAdmin] = useState<any>(null);
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Current User (Me)
                const meRes = await fetch('/api/user/profile');
                if (meRes.ok) setCurrentUser(await meRes.json());

                // Fetch Admin
                const res = await fetch('/api/admins');
                const data = await res.json();
                const found = data.find((a: any) => a.id.toString() === params.id);
                setAdmin(found);

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

    if (loading) return <div className="p-8 text-center text-slate-500">{t?.common?.loading || 'Loading...'}</div>;
    if (!admin) return <div className="p-8 text-center text-red-500">{t?.userDetail?.admin?.notFound || 'Admin tidak ditemukan.'}</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/users/admin"><ChevronLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">{admin.name}</h1>
                        <p className="text-slate-500">{t.userDetail.admin.title}</p>
                    </div>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link href={`/dashboard/users/admin/${params.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" /> {t.userDetail.actions.editProfile}
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Info */}
                <Card className="md:col-span-1 shadow-sm h-fit">
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4 bg-primary/10 text-primary">
                            <AvatarFallback className="text-2xl font-bold">
                                {admin.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="text-lg font-bold text-slate-900">{admin.name}</h2>
                        <div className="text-sm text-slate-500 mb-4">{admin.email}</div>

                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 mb-4">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            {t.userDetail.admin.title}
                        </Badge>
                    </CardContent>
                </Card>

                {/* Main Content Tabs */}
                <div className="md:col-span-3">
                    <Tabs defaultValue="profile">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="profile">{t.userDetail.tabs.profile}</TabsTrigger>
                            <TabsTrigger value="activity">{t.userDetail.tabs.activity}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t.userDetail.profile.title}</CardTitle>
                                    <CardDescription>{t.userDetail.profile.subtitle}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500 uppercase">{t.userDetail.profile.fullName}</Label>
                                            <div className="flex items-center gap-2 font-medium">
                                                <User className="h-4 w-4 text-slate-400" /> {admin.name}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500 uppercase">{t.userDetail.profile.email}</Label>
                                            <div className="flex items-center gap-2 font-medium">
                                                <Mail className="h-4 w-4 text-slate-400" /> {admin.email}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500 uppercase">{t.userDetail.profile.role}</Label>
                                            <div className="flex items-center gap-2 font-medium">
                                                <KeyRound className="h-4 w-4 text-slate-400" /> {t.userDetail.admin.title}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500 uppercase">{t.userDetail.profile.registeredSince}</Label>
                                            <div className="flex items-center gap-2 font-medium">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="activity">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex flex-col space-y-1.5">
                                        <CardTitle>{t.userDetail.activity.title}</CardTitle>
                                        <CardDescription>{t.userDetail.activity.subtitle}</CardDescription>
                                    </div>
                                    {currentUser?.role === 'SUPERADMIN' && logs.length > 0 && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-8"
                                            onClick={triggerDeleteAllLogs}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> {t.userDetail.activity.deleteAll}
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {logs.length > 0 ? (
                                            <>
                                                {logs.map((log: any) => (
                                                    <div key={log.id} className="group flex items-start justify-between gap-4 pb-4 border-b last:border-0 last:pb-0">
                                                        <div className="flex items-start gap-4">
                                                            <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-medium text-slate-900">{log.description || log.action}</p>
                                                                <p className="text-xs text-slate-500">
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
                                                                className="h-6 w-6 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => triggerDeleteLog(log.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}

                                                {/* Pagination Controls */}
                                                <div className="flex items-center justify-between pt-4 border-t">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                                        disabled={page === 1}
                                                    >
                                                        {t.userDetail.activity.previous}
                                                    </Button>
                                                    <span className="text-xs text-slate-500">
                                                        {t.userDetail.activity.page} {page} {t.userDetail.activity.of} {pagination.totalPages || 1}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                                        disabled={page >= (pagination.totalPages || 1)}
                                                    >
                                                        {t.userDetail.activity.next}
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-12 text-slate-500">
                                                <p>{t.userDetail.activity.empty}</p>
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
                        <DialogTitle>{t.userDetail.dialog.deleteTitle}</DialogTitle>
                        <DialogDescription>
                            {deleteMode === 'ALL'
                                ? t.userDetail.dialog.deleteAll
                                : t.userDetail.dialog.deleteSingle
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t.userDetail.dialog.cancel}</Button>
                        <Button variant="destructive" onClick={confirmDelete}>{t.userDetail.dialog.delete}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
