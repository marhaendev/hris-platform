'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Upload, Briefcase, Building2, User, Download, ChevronLeft, Edit, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DocumentPreviewModal } from '@/components/DocumentPreviewModal';
import Link from 'next/link';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [employee, setEmployee] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);


    // Upload State
    const [file, setFile] = useState<File | null>(null);
    const [docType, setDocType] = useState('OTHERS');
    const [docTitle, setDocTitle] = useState('');

    const [logs, setLogs] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>({});

    // Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteMode, setDeleteMode] = useState<'SINGLE' | 'ALL'>('SINGLE');
    const [deleteLogId, setDeleteLogId] = useState<number | null>(null);

    // Preview State
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<{ id: string | number; title: string } | null>(null);

    const { t } = useLanguage();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Current User (Me)
                const meRes = await fetch('/api/user/profile');
                if (meRes.ok) setCurrentUser(await meRes.json());

                // Fetch Employee
                const empRes = await fetch('/api/employees');
                const empData = await empRes.json();
                const found = empData.find((e: any) => e.id.toString() === params.id);
                setEmployee(found);

                if (found) {
                    // Fetch Logs using found.user.id
                    const logRes = await fetch(`/api/activity-logs?userId=${found.user.id}&page=${page}&limit=5`);
                    const logData = await logRes.json();

                    if (logData.logs) {
                        setLogs(logData.logs);
                        setPagination(logData.pagination);
                    }
                }

                // Fetch Documents
                const docRes = await fetch(`/api/employees/${params.id}/documents`);
                setDocuments(await docRes.json());


                // Fetch Departments & Positions
                const deptRes = await fetch('/api/departments');
                setDepartments(await deptRes.json());

                const posRes = await fetch('/api/positions');
                setPositions(await posRes.json());

            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id, page]);


    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', docTitle || file.name);
        formData.append('type', docType);

        try {
            const res = await fetch(`/api/employees/${params.id}/documents`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                // Refresh list
                const newDocs = await fetch(`/api/employees/${params.id}/documents`).then(r => r.json());
                setDocuments(newDocs);
                setFile(null);
                setDocTitle('');
                toast.success(t.userDetail.documents.uploadSuccess);
            } else {
                toast.error(t.userDetail.documents.uploadFailed);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

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
            } else if (deleteMode === 'ALL' && employee?.user?.id) {
                res = await fetch(`/api/activity-logs?userId=${employee.user.id}`, { method: 'DELETE' });
            }

            if (res && res.ok) {
                const data = await res.json();
                toast.success(deleteMode === 'ALL' ? t.userDetail.toast.logsDeleted.replace('{count}', data.count) : t.userDetail.toast.logDeleted);

                // Refresh Logs
                if (employee && employee.user) {
                    const logRes = await fetch(`/api/activity-logs?userId=${employee.user.id}&page=${page}&limit=5`);
                    const logData = await logRes.json();
                    if (logData.logs) {
                        setLogs(logData.logs);
                        setPagination(logData.pagination);
                    } else {
                        setLogs([]);
                        setPagination({});
                    }
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
    if (!employee) return <div className="p-8 text-center text-red-500">{t?.userDetail?.employee?.notFound || 'Karyawan tidak ditemukan.'}</div>;


    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" asChild>
                        <Link href="/dashboard/users/employees"><ChevronLeft className="h-4 w-4 md:h-5 md:w-5" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-800 leading-tight">{employee.user.name}</h1>
                        <p className="text-xs md:text-sm text-slate-500 font-medium">{employee.position} &bull; {employee.department}</p>
                    </div>
                </div>
                <Button size="sm" className="h-8 md:h-10 text-xs md:text-sm px-3 md:px-4" asChild>
                    <Link href={`/dashboard/users/employees/${params.id}/edit`}>
                        <Edit className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> {t.userDetail.actions.editProfile}
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                {/* Sidebar Info */}
                <Card className="md:col-span-1 shadow-sm h-fit">
                    <CardContent className="pt-6 flex flex-col items-center text-center p-4 md:p-6">
                        <Avatar className="h-20 w-20 md:h-24 md:w-24 mb-3 md:mb-4 ring-4 ring-slate-50">
                            <AvatarFallback className="text-xl md:text-2xl bg-slate-100 text-slate-600 font-bold">
                                {employee.user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <Badge variant="secondary" className="mb-2 uppercase tracking-wider text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{employee.department}</Badge>
                        <div className="text-xs md:text-sm text-slate-500 font-medium break-all">{employee.user.email}</div>
                    </CardContent>
                </Card>

                {/* Main Content Tabs */}
                <div className="md:col-span-3">
                    <Tabs defaultValue="profile">
                        <TabsList className="grid w-full grid-cols-3 h-9 md:h-10">
                            <TabsTrigger value="profile" className="text-xs md:text-sm">{t.userDetail.tabs.profileEmployee}</TabsTrigger>
                            <TabsTrigger value="documents" className="text-xs md:text-sm">{t.userDetail.tabs.documents}</TabsTrigger>
                            <TabsTrigger value="activity" className="text-xs md:text-sm">{t.userDetail.tabs.activity}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="mt-4">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-3 pt-4 px-4 md:p-6">
                                    <CardTitle className="text-base md:text-lg text-slate-800">{t.userDetail.profile.titleEmployee}</CardTitle>
                                    <CardDescription className="text-xs md:text-sm">{t.userDetail.profile.subtitleEmployee}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 px-4 pb-4 md:p-6 md:pt-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                                        <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <Label className="text-[10px] md:text-xs text-slate-500 uppercase font-bold tracking-wider">{t.userDetail.profile.position}</Label>
                                            <div className="flex items-center gap-2 text-sm md:text-base font-semibold text-slate-700">
                                                <Briefcase className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-400" /> {employee.position}
                                            </div>
                                        </div>
                                        <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <Label className="text-[10px] md:text-xs text-slate-500 uppercase font-bold tracking-wider">{t.userDetail.profile.department}</Label>
                                            <div className="flex items-center gap-2 text-sm md:text-base font-semibold text-slate-700">
                                                <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-400" /> {employee.department}
                                            </div>
                                        </div>
                                        <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <Label className="text-[10px] md:text-xs text-slate-500 uppercase font-bold tracking-wider">{t.userDetail.profile.baseSalary}</Label>
                                            <div className="text-sm md:text-base font-semibold text-slate-700">Rp {employee.baseSalary.toLocaleString('id-ID')}</div>
                                        </div>
                                        <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <Label className="text-[10px] md:text-xs text-slate-500 uppercase font-bold tracking-wider">{t.userDetail.profile.joinDate}</Label>
                                            <div className="text-sm md:text-base font-semibold text-slate-700">{new Date(employee.joinDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="documents" className="mt-4">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-3 pt-4 px-4 md:p-6">
                                    <CardTitle className="text-base md:text-lg text-slate-800">{t.userDetail.documents.title}</CardTitle>
                                    <CardDescription className="text-xs md:text-sm">{t.userDetail.documents.subtitle}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 px-4 pb-4 md:p-6 md:pt-0">

                                    {/* Upload Form */}
                                    <div className="p-3 md:p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                                        <h3 className="text-xs md:text-sm font-bold mb-3 flex items-center gap-2 text-slate-700"><Upload className="h-3.5 w-3.5 md:h-4 md:w-4" /> {t.userDetail.documents.uploadTitle}</h3>
                                        <form onSubmit={handleUpload} className="space-y-2 md:space-y-3">
                                            <div className="grid grid-cols-2 gap-2 md:gap-3">
                                                <Input
                                                    placeholder={t.userDetail.documents.documentName}
                                                    value={docTitle}
                                                    onChange={e => setDocTitle(e.target.value)}
                                                    required
                                                    className="bg-white h-9 md:h-10 text-xs md:text-sm"
                                                />
                                                <select
                                                    className="flex h-9 md:h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-1 md:py-2 text-xs md:text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                                    value={docType}
                                                    onChange={e => setDocType(e.target.value)}
                                                >
                                                    <option value="KTP">{t.userDetail.documents.types.ktp}</option>
                                                    <option value="CONTRACT">{t.userDetail.documents.types.contract}</option>
                                                    <option value="CV">{t.userDetail.documents.types.cv}</option>
                                                    <option value="OTHERS">{t.userDetail.documents.types.others}</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="file"
                                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                                    required
                                                    className="bg-white h-9 md:h-10 text-xs md:text-sm py-1.5 md:py-2"
                                                />
                                                <Button type="submit" disabled={uploading} size="sm" className="h-9 md:h-10 text-xs md:text-sm">
                                                    {uploading ? t.userDetail.documents.uploading : t.userDetail.actions.save}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Document List */}
                                    <div className="space-y-2">
                                        {documents.map((doc: any) => (
                                            <div key={doc.id} className="flex items-center justify-between p-2.5 md:p-3 border rounded-lg hover:bg-slate-50 transition-colors bg-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                                                        <FileText className="h-4 w-4 md:h-5 md:w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-xs md:text-sm text-slate-800">{doc.title}</div>
                                                        <div className="text-[10px] md:text-xs text-slate-500 font-medium">{doc.type} &bull; {new Date(doc.uploadedAt).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 md:gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 md:h-9 md:w-9"
                                                        onClick={() => {
                                                            setSelectedDoc({ id: doc.id, title: doc.title });
                                                            setPreviewOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-400" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 md:h-9 md:w-9" asChild>
                                                        <a href={doc.fileUrl} target="_blank" download>
                                                            <Download className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-400" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {documents.length === 0 && (
                                            <div className="text-center py-8 text-slate-400 text-xs md:text-sm">
                                                {t.userDetail.documents.empty}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="activity" className="mt-4">
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4 md:p-6">
                                    <div className="flex flex-col space-y-1">
                                        <CardTitle className="text-base md:text-lg">{t.userDetail.activity.title}</CardTitle>
                                        <CardDescription className="text-xs md:text-sm">{t.userDetail.activity.subtitleEmployee}</CardDescription>
                                    </div>
                                    {currentUser?.role === 'SUPERADMIN' && logs.length > 0 && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-7 md:h-8 text-xs md:text-sm px-2 md:px-3"
                                            onClick={triggerDeleteAllLogs}
                                        >
                                            <Trash2 className="mr-2 h-3 w-3 md:h-4 md:w-4" /> {t.userDetail.activity.deleteAll}
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="px-4 pb-4 md:p-6 md:pt-0">
                                    <div className="space-y-4">
                                        {logs.length > 0 ? (
                                            logs.map((log: any) => (
                                                <div key={log.id} className="group flex items-start justify-between gap-4 pb-3 border-b last:border-0 last:pb-0 border-slate-100">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1.5 h-1.5 w-1.5 bg-blue-500 shrink-0 rounded-full" />
                                                        <div className="space-y-0.5">
                                                            <p className="text-xs md:text-sm font-semibold text-slate-800">{log.description || log.action}</p>
                                                            <p className="text-[10px] md:text-xs text-slate-400 font-mono">
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
                                                            className="h-5 w-5 md:h-8 md:w-8 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => triggerDeleteLog(log.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 text-slate-500 text-xs md:text-sm">
                                                <p>{t.userDetail.activity.empty}</p>
                                            </div>
                                        )}

                                        {logs.length > 0 && (
                                            <div className="flex items-center justify-between pt-3 border-t">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 md:h-9 text-xs md:text-sm"
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    disabled={page === 1}
                                                >
                                                    {t.userDetail.activity.previous}
                                                </Button>
                                                <span className="text-[10px] md:text-xs text-slate-500 font-medium">
                                                    {t.userDetail.activity.page} {page} {t.userDetail.activity.of} {pagination.totalPages || 1}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 md:h-9 text-xs md:text-sm"
                                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                                    disabled={page >= (pagination.totalPages || 1)}
                                                >
                                                    {t.userDetail.activity.next}
                                                </Button>
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
                <DialogContent className="sm:max-w-xs md:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg">{t.userDetail.dialog.deleteTitle}</DialogTitle>
                        <DialogDescription className="text-xs md:text-sm">
                            {deleteMode === 'ALL'
                                ? t.userDetail.dialog.deleteAll
                                : t.userDetail.dialog.deleteSingle
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)}>{t.userDetail.dialog.cancel}</Button>
                        <Button variant="destructive" size="sm" onClick={confirmDelete}>{t.userDetail.dialog.delete}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DocumentPreviewModal
                isOpen={previewOpen}
                onOpenChange={setPreviewOpen}
                docId={selectedDoc?.id || null}
                title={selectedDoc?.title || ''}
            />

        </div >
    );
}
