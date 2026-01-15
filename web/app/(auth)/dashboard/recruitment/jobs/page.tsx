'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, Plus, Search, MapPin, DollarSign, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface JobPosting {
    id: number;
    title: string;
    status: string;
    location: string;
    employment_type: string;
    salary_min: number;
    salary_max: number;
    posted_date: string;
    position_name: string;
}

export default function JobsListPage() {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [sortOrder, setSortOrder] = useState("LATEST");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [metadata, setMetadata] = useState({ total: 0, totalPages: 1 });
    const [isLoading, setIsLoading] = useState(true);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchJobs();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter, sortOrder, page, limit]);



    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                q: searchQuery,
                status: statusFilter,
                sort: sortOrder
            });
            const res = await fetch(`/api/recruitment/jobs?${params}`);
            const result = await res.json();

            if (result.data) {
                setJobs(result.data);
                setMetadata({
                    total: result.metadata.total,
                    totalPages: result.metadata.totalPages
                });
            } else {
                setJobs([]);
                setMetadata({ total: 0, totalPages: 1 });
            }
        } catch (error) {
            console.error("Failed to fetch jobs", error);
            setJobs([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getRelativeTime = (dateString: string) => {
        if (!dateString) return 'Tanggal tidak tersedia';

        const now = new Date();
        const past = new Date(dateString);

        // Check if date is valid
        if (isNaN(past.getTime())) {
            return 'Tanggal tidak valid';
        }

        const diffMs = now.getTime() - past.getTime();

        // If date is in the future, show the actual date
        if (diffMs < 0) {
            return past.toLocaleDateString('id-ID');
        }

        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        if (diffSec < 60) return 'Baru saja';
        if (diffMin < 60) return `${diffMin} menit lalu`;
        if (diffHour < 24) return `${diffHour} jam lalu`;
        if (diffDay < 7) return `${diffDay} hari lalu`;
        if (diffWeek < 4) return `${diffWeek} minggu lalu`;
        if (diffMonth < 12) return `${diffMonth} bulan lalu`;
        return `${diffYear} tahun lalu`;
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            {/* Header */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Lowongan Pekerjaan</h2>
                    <p className="text-slate-500">Kelola semua lowongan pekerjaan.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Cari lowongan..."
                            className="pl-8 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-auto"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="LATEST">Terbaru</option>
                        <option value="OLDEST">Terlama</option>
                        <option value="AZ">Abjad A-Z</option>
                        <option value="ZA">Abjad Z-A</option>
                    </select>
                    <select
                        className="flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-auto"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="OPEN">Open</option>
                        <option value="CLOSED">Closed</option>
                        <option value="DRAFT">Draft</option>
                    </select>
                    <Link href="/dashboard/recruitment/jobs/new" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Jobs List */}
            <div className="space-y-3">
                {isLoading ? (
                    <p className="text-center py-12 text-slate-500">Loading...</p>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        {searchQuery || statusFilter !== "ALL" ? "Tidak ada lowongan yang cocok." : "Belum ada lowongan."}
                    </div>
                ) : (
                    jobs.map((job) => (
                        <Link key={job.id} href={`/dashboard/recruitment/jobs/${job.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                                                <Briefcase className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-base truncate">{job.title}</h3>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${job.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                                                        job.status === 'CLOSED' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {job.status}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                                                    {job.position_name && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                                                            <span className="text-xs font-medium">{job.position_name}</span>
                                                        </div>
                                                    )}
                                                    {job.location && (
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                            <span className="text-xs">{job.location}</span>
                                                        </div>
                                                    )}
                                                    {(job.salary_min || job.salary_max) && (
                                                        <span className="text-xs text-slate-600">
                                                            {job.salary_min && job.salary_max
                                                                ? `Rp ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                                                                : job.salary_min
                                                                    ? `Rp ${job.salary_min.toLocaleString()}+`
                                                                    : `Up to Rp ${job.salary_max?.toLocaleString()}`
                                                            }
                                                        </span>
                                                    )}
                                                    <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs">
                                                        {job.employment_type?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 text-right">
                                            {job.posted_date && (
                                                <span className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
                                                    <Calendar className="h-3 w-3" />
                                                    {getRelativeTime(job.posted_date)}
                                                </span>
                                            )}
                                            <Button variant="outline" size="sm" className="flex-shrink-0">
                                                Detail
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && metadata.total > 0 && (
                <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Rows per page:</span>
                        <select
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1); // Reset to page 1 when limit changes
                            }}
                        >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <span className="text-sm text-slate-500 ml-2">
                            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, metadata.total)} of {metadata.total}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-slate-500">
                            Page {page} of {metadata.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(metadata.totalPages, p + 1))}
                            disabled={page === metadata.totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
