'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Search, Mail, Phone, Briefcase, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Applicant {
    id: number;
    jobId: number;
    name: string;
    email: string;
    phone: string;
    status: string;
    applied_date: string;
}

interface JobPosting {
    id: number;
    title: string;
}

const STATUS_CONFIG = {
    NEW: { label: 'Baru', color: 'bg-blue-100 text-blue-700', step: 1 },
    SCREENING: { label: 'Screening', color: 'bg-yellow-100 text-yellow-700', step: 2 },
    INTERVIEW: { label: 'Interview', color: 'bg-purple-100 text-purple-700', step: 3 },
    OFFERED: { label: 'Ditawarkan', color: 'bg-green-100 text-green-700', step: 4 },
    REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-700', step: 0 },
    HIRED: { label: 'Diterima', color: 'bg-emerald-100 text-emerald-700', step: 5 },
};

export default function ApplicantsPage() {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
    const [jobs, setJobs] = useState<Record<number, JobPosting>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = applicants;

        if (searchQuery) {
            filtered = filtered.filter(app =>
                app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== "ALL") {
            filtered = filtered.filter(app => app.status === statusFilter);
        }

        setFilteredApplicants(filtered);
    }, [searchQuery, statusFilter, applicants]);

    const fetchData = async () => {
        try {
            // Fetch applicants
            const appRes = await fetch('/api/recruitment/applicants');
            const appData = await appRes.json();

            if (Array.isArray(appData)) {
                setApplicants(appData);
                setFilteredApplicants(appData);
            } else {
                console.error("Applicants API issue:", appData);
                setApplicants([]);
                setFilteredApplicants([]);
            }

            // Fetch jobs for mapping
            const jobsRes = await fetch('/api/recruitment/jobs');
            const jobsData = await jobsRes.json();

            const jobsMap: Record<number, JobPosting> = {};
            if (Array.isArray(jobsData)) {
                jobsData.forEach((job: JobPosting) => {
                    jobsMap[job.id] = job;
                });
            }
            setJobs(jobsMap);
        } catch (error) {
            console.error("Failed to fetch data", error);
            setApplicants([]);
            setFilteredApplicants([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            {/* Header */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Pelamar</h2>
                    <p className="text-slate-500">Track semua pelamar dan status proses mereka.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Cari pelamar..."
                            className="pl-8 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="flex h-10 items-center rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-auto"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="NEW">Baru</option>
                        <option value="SCREENING">Screening</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="OFFERED">Ditawarkan</option>
                        <option value="REJECTED">Ditolak</option>
                        <option value="HIRED">Diterima</option>
                    </select>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-6">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const count = applicants.filter(a => a.status === status).length;
                    return (
                        <Card key={status} className="shadow-sm">
                            <CardContent className="p-4 text-center">
                                <div className={`text-2xl font-bold ${config.color.split(' ')[1]}`}>
                                    {count}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{config.label}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Applicants List */}
            <div className="space-y-3">
                {isLoading ? (
                    <p className="text-center py-12 text-slate-500">Loading...</p>
                ) : filteredApplicants.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        {searchQuery || statusFilter !== "ALL" ? "Tidak ada pelamar yang cocok." : "Belum ada pelamar."}
                    </div>
                ) : (
                    filteredApplicants.map((applicant) => {
                        const statusConfig = STATUS_CONFIG[applicant.status as keyof typeof STATUS_CONFIG];
                        const job = jobs[applicant.jobId];

                        return (
                            <Card key={applicant.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                                                <User className="h-6 w-6" />
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
                                                        <Briefcase className="h-4 w-4 text-slate-400" />
                                                        <span className="truncate">{job?.title || 'Unknown Position'}</span>
                                                    </div>
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

                                                {/* Progress Bar */}
                                                {statusConfig.step > 0 && (
                                                    <div className="mt-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs text-slate-500">Progress:</span>
                                                            <span className="text-xs font-medium text-slate-700">
                                                                {statusConfig.step}/5
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                                style={{ width: `${(statusConfig.step / 5) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Link href={`/dashboard/recruitment/applicants/${applicant.id}`}>
                                            <Button variant="outline" size="sm">
                                                Detail
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
