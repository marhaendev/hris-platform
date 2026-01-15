'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Calendar, Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface JobPosting {
    id: number;
    title: string;
    status: string;
    posted_date: string;
    closing_date: string;
}

export default function RecruitmentDashboard() {
    const [stats, setStats] = useState({
        openJobs: 0,
        totalApplicants: 0,
        interviewsToday: 0
    });
    const [recentJobs, setRecentJobs] = useState<JobPosting[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch open jobs
            const jobsRes = await fetch('/api/recruitment/jobs?status=OPEN');
            const jobs = await jobsRes.json();

            // Fetch all applicants
            const applicantsRes = await fetch('/api/recruitment/applicants');
            const applicants = await applicantsRes.json();

            // Fetch today's interviews
            const interviewsRes = await fetch('/api/recruitment/interviews');
            const interviews = await interviewsRes.json();
            const today = new Date().toISOString().split('T')[0];
            const todayInterviews = interviews.filter((i: any) =>
                i.scheduled_date?.startsWith(today)
            );

            setStats({
                openJobs: jobs.length || 0,
                totalApplicants: applicants.length || 0,
                interviewsToday: todayInterviews.length || 0
            });

            // Get recent jobs
            const allJobsRes = await fetch('/api/recruitment/jobs');
            const allJobs = await allJobsRes.json();
            setRecentJobs(allJobs.slice(0, 5));

        } catch (error) {
            console.error("Failed to fetch recruitment data", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Rekrutmen</h2>
                    <p className="text-slate-500">Kelola lowongan pekerjaan dan pelamar.</p>
                </div>
                <Link href="/dashboard/recruitment/jobs/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Buat Lowongan
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Lowongan Aktif</CardTitle>
                        <Briefcase className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.openJobs}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            Posisi terbuka
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Pelamar</CardTitle>
                        <Users className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.totalApplicants}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            Semua status
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Wawancara Hari Ini</CardTitle>
                        <Calendar className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.interviewsToday}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            Terjadwal
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Jobs */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Lowongan Terbaru</CardTitle>
                            <p className="text-sm text-slate-500 mt-1">5 lowongan terakhir</p>
                        </div>
                        <Link href="/dashboard/recruitment/jobs">
                            <Button variant="outline" size="sm">
                                Lihat Semua
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-sm text-slate-500">Loading...</p>
                    ) : recentJobs.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">Belum ada lowongan.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentJobs.map((job) => (
                                <Link key={job.id} href={`/dashboard/recruitment/jobs/${job.id}`}>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                <Briefcase className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm">{job.title}</h4>
                                                <p className="text-xs text-slate-500">
                                                    Posted: {job.posted_date ? new Date(job.posted_date).toLocaleDateString('id-ID') : 'Draft'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${job.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                                                job.status === 'CLOSED' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {job.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
