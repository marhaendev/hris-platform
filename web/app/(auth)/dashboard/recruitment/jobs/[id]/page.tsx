'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, DollarSign, Calendar, Briefcase, User, Plus, Search, Mail, Phone, Trash2, Edit, CalendarClock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Link from 'next/link';

interface JobPosting {
    id: number;
    title: string;
    departmentId: number;
    positionId: number;
    description: string;
    requirements: string;
    status: string;
    salary_min: number;
    salary_max: number;
    location: string;
    employment_type: string;
    posted_date: string;
    closing_date: string;
}

interface Applicant {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
    applied_date: string;
}

const STATUS_TABS = [
    { id: 'ALL', label: 'Semua', color: 'text-slate-700' },
    { id: 'NEW', label: 'Baru', color: 'text-blue-700' },
    { id: 'SCREENING', label: 'Screening', color: 'text-yellow-700' },
    { id: 'INTERVIEW', label: 'Interview', color: 'text-purple-700' },
    { id: 'OFFERED', label: 'Ditawarkan', color: 'text-green-700' },
    { id: 'REJECTED', label: 'Ditolak', color: 'text-red-700' },
    { id: 'HIRED', label: 'Diterima', color: 'text-emerald-700' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    NEW: { label: 'Baru', color: 'bg-blue-100 text-blue-700' },
    SCREENING: { label: 'Screening', color: 'bg-yellow-100 text-yellow-700' },
    INTERVIEW: { label: 'Interview', color: 'bg-purple-100 text-purple-700' },
    OFFERED: { label: 'Ditawarkan', color: 'bg-green-100 text-green-700' },
    REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-700' },
    HIRED: { label: 'Diterima', color: 'bg-emerald-100 text-emerald-700' },
};

import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function JobDetailPage({ params }: { params: { id: string } }) {
    // ... existing state ...
    const [job, setJob] = useState<JobPosting | null>(null);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("ALL");
    const [isLoading, setIsLoading] = useState(true);

    // ... existing useEffects ...
    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        let filtered = applicants;
        if (activeTab !== 'ALL') filtered = filtered.filter(app => app.status === activeTab);
        if (searchQuery) {
            filtered = filtered.filter(app =>
                app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setFilteredApplicants(filtered);
    }, [searchQuery, activeTab, applicants]);

    const fetchData = async () => {
        try {
            const jobRes = await fetch(`/api/recruitment/jobs?id=${params.id}`);
            const jobData = await jobRes.json();
            setJob(jobData);
            setFormData({
                posted_date: jobData.posted_date ? new Date(jobData.posted_date).toISOString().split('T')[0] : '',
                closing_date: jobData.closing_date ? new Date(jobData.closing_date).toISOString().split('T')[0] : ''
            });

            const appRes = await fetch(`/api/recruitment/applicants?job_posting_id=${params.id}`);
            const appData = await appRes.json();
            setApplicants(appData);
            setFilteredApplicants(appData);
        } catch (error) {
            console.error("Failed to fetch job details", error);
            toast.error("Gagal memuat detail lowongan");
        } finally {
            setIsLoading(false);
        }
    };

    const router = useRouter();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        posted_date: '',
        closing_date: ''
    });

    const handleUpdate = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/recruitment/jobs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: job?.id,
                    posted_date: formData.posted_date ? new Date(formData.posted_date).toISOString() : null,
                    closing_date: formData.closing_date ? new Date(formData.closing_date).toISOString() : null
                })
            });

            if (res.ok) {
                setEditDialogOpen(false);
                fetchData();
                toast.success("Waktu lowongan berhasil diperbarui");
            } else {
                const data = await res.json();
                toast.error(data.error || "Gagal memperbarui data");
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        // Confirm moved to Dialog Logic
        setIsSaving(true);
        try {
            const res = await fetch(`/api/recruitment/jobs?id=${job?.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success("Lowongan berhasil dihapus");
                router.push('/dashboard/recruitment/jobs');
            } else {
                const data = await res.json();
                toast.error(data.error || "Gagal menghapus lowongan");
                setDeleteDialogOpen(false); // Close dialog on error to allow retry or cancel
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan sistem");
            setDeleteDialogOpen(false);
        } finally {
            setIsSaving(false);
        }
    };

    const getCountByStatus = (status: string) => {
        if (status === 'ALL') return applicants.length;
        return applicants.filter(app => app.status === status).length;
    };

    if (isLoading) return <div className="flex-1 p-8">Loading...</div>;
    if (!job) return <div className="flex-1 p-8">Job not found</div>;

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <Link href="/dashboard/recruitment/jobs" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors bg-white w-fit px-3 py-1.5 rounded-md border shadow-sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
            </Link>

            {/* Job Details */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{job.title}</CardTitle>
                            <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-600">
                                {job.location && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4" />
                                        <span>{job.location}</span>
                                    </div>
                                )}
                                {(job.salary_min || job.salary_max) && (
                                    <div className="flex items-center gap-1.5">
                                        <DollarSign className="h-4 w-4" />
                                        <span>
                                            {job.salary_min && job.salary_max
                                                ? `Rp ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                                                : job.salary_min
                                                    ? `Rp ${job.salary_min.toLocaleString()}+`
                                                    : `Up to Rp ${job.salary_max?.toLocaleString()}`
                                            }
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <Briefcase className="h-4 w-4" />
                                    <span>{job.employment_type?.replace('_', ' ')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                                <CalendarClock className="mr-2 h-4 w-4" />
                                Edit Waktu
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* Edit Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Waktu Lowongan</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Tanggal Posting</Label>
                                <Input
                                    type="date"
                                    value={formData.posted_date}
                                    onChange={(e) => setFormData({ ...formData, posted_date: e.target.value })}
                                    disabled={true}
                                    className="bg-slate-50 cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-500">Tanggal posting tidak dapat diubah setelah dibuat.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal Penutupan (Closing Date)</Label>
                                <Input
                                    type="date"
                                    value={formData.closing_date}
                                    onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
                                />
                                <p className="text-xs text-slate-500">Kosongkan jika tidak ada batas waktu.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSaving}>Batal</Button>
                            <Button onClick={handleUpdate} disabled={isSaving}>
                                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Alert Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Lowongan?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tindakan ini tidak dapat dibatalkan. Lowongan ini akan dihapus permanen dari sistem.
                                Pastikan tidak ada data pelamar penting yang terkait.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSaving}>Batal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent auto-close
                                    handleDelete();
                                }}
                                disabled={isSaving}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                                {isSaving ? "Menghapus..." : "Ya, Hapus"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <CardContent className="space-y-4">
                    {job.description && (
                        <div>
                            <h3 className="font-semibold mb-2">Deskripsi Pekerjaan</h3>
                            <p className="text-slate-600 whitespace-pre-wrap">{job.description}</p>
                        </div>
                    )}
                    {job.requirements && (
                        <div>
                            <h3 className="font-semibold mb-2">Persyaratan</h3>
                            <p className="text-slate-600 whitespace-pre-wrap">{job.requirements}</p>
                        </div>
                    )}
                    <div className="flex gap-4 text-sm text-slate-500 pt-2 border-t">
                        {job.posted_date && (
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                <span>Posted: {new Date(job.posted_date).toLocaleDateString('id-ID')}</span>
                            </div>
                        )}
                        {job.closing_date && (
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                <span>Closes: {new Date(job.closing_date).toLocaleDateString('id-ID')}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Applicants Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Pelamar ({applicants.length})</h2>
                    <div className="flex items-center gap-2">
                        {/* Search Toggle */}
                        <div
                            className="relative overflow-hidden transition-all duration-300 ease-out"
                            style={{ width: searchQuery ? '256px' : '40px' }}
                        >
                            {searchQuery ? (
                                <>
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="Cari pelamar..."
                                        className="pl-10 pr-8 border-slate-300 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 outline-none"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearchQuery(" ")}
                                    className="transition-all duration-200 hover:scale-105 border-slate-300 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 outline-none w-10 h-10 p-0"
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Pelamar
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {tab.label} ({getCountByStatus(tab.id)})
                        </button>
                    ))}
                </div>

                {/* Applicants List */}
                <div className="space-y-3">
                    {filteredApplicants.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            {searchQuery ? "Tidak ada pelamar yang cocok." : "Belum ada pelamar."}
                        </div>
                    ) : (
                        filteredApplicants.map(applicant => {
                            const statusConfig = STATUS_CONFIG[applicant.status];
                            return (
                                <Link key={applicant.id} href={`/dashboard/recruitment/applicants/${applicant.id}`}>
                                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="font-semibold text-base">{applicant.name}</h3>
                                                            <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.color}`}>
                                                                {statusConfig.label}
                                                            </span>
                                                        </div>
                                                        <div className="grid md:grid-cols-2 gap-2 text-sm text-slate-600">
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="h-4 w-4 text-slate-400" />
                                                                <span className="truncate">{applicant.email}</span>
                                                            </div>
                                                            {applicant.phone && (
                                                                <div className="flex items-center gap-2">
                                                                    <Phone className="h-4 w-4 text-slate-400" />
                                                                    <span>{applicant.phone}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                                <span>{new Date(applicant.applied_date).toLocaleDateString('id-ID')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button variant="outline" size="sm">
                                                    Detail
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
