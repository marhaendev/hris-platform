"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Banknote, Clock, Building2, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import { CalendarCheck, Hourglass, Timer, UserCircle, ArrowUpRight } from 'lucide-react';
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardStats {
    totalEmployees: number;
    departments: { active: number; total: number };
    positions: { active: number; total: number };
    presentToday: number;
    totalPayroll: number;
    attendanceChart: { date: string; present: number; late: number; count?: number }[];
    recentEmployees: { id: number; name: string; position: string; joinDate: string }[];
    personalStats?: {
        attendanceCount: number;
        leaveBalance: number;
        todayStatus: string;
        baseSalary: number;
    };
    todayAttendance?: {
        onTime: number;
        late: number;
        absent: number;
        total: number;
    };
}

export default function Dashboard() {
    const user = useUser();
    const { t } = useLanguage();
    const [stats, setStats] = useState<DashboardStats>({
        totalEmployees: 0,
        departments: { active: 0, total: 0 },
        positions: { active: 0, total: 0 },
        presentToday: 0,
        totalPayroll: 0,
        attendanceChart: [],
        recentEmployees: []
    });
    const [loading, setLoading] = useState(true);
    const [chartRange, setChartRange] = useState<'week' | 'month' | 'year'>('week');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Keep loading true only on first load if desired, but for chart switch it's better to show loading state or skeletal
                // For now, let's just fetch
                const res = await fetch(`/api/dashboard/stats?range=${chartRange}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [chartRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    // Chart Configuration
    const isChartPersonal = !!stats.personalStats;
    const chartDataMax = stats.attendanceChart.length > 0 ? Math.max(...stats.attendanceChart.map(d => (d.present || 0) + (d.late || 0)), 0) : 0;
    const scaleLimit = chartRange === 'year' ? 31 : (chartRange === 'month' ? 5 : 1);
    const chartScaleMax = Math.max(chartDataMax, scaleLimit);

    const chartTicks = chartScaleMax <= 5
        ? Array.from({ length: chartScaleMax + 1 }, (_, i) => i)
        : [0, 0.25, 0.5, 0.75, 1].map(r => Math.round(chartScaleMax * r));

    // Reverse for Y-Axis labels (Top to Bottom)
    const chartLabels = Array.from(new Set(chartTicks)).sort((a, b) => b - a);

    const AttendancePieChart = ({ data, loading }: { data?: any, loading: boolean }) => {
        if (loading) return (
            <div className="h-[250px] flex items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-400">
                {t.common.loading}
            </div>
        );

        if (!data || data.total === 0) return (
            <div className="h-[250px] flex items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-400">
                {t.common.noData}
            </div>
        );

        const { onTime, late, absent, total } = data;
        const onTimePct = total > 0 ? (onTime / total) * 100 : 0;
        const latePct = total > 0 ? (late / total) * 100 : 0;
        const absentPct = total > 0 ? (absent / total) * 100 : 0;

        return (
            <div className="flex flex-col items-center justify-center pt-4">
                <div
                    className="w-40 h-40 rounded-full shadow-inner relative transition-transform duration-500 hover:scale-105"
                    style={{
                        background: `conic-gradient(
                            #10b981 0% ${onTimePct}%, 
                            #f59e0b ${onTimePct}% ${onTimePct + latePct}%, 
                            #ef4444 ${onTimePct + latePct}% 100%
                        )`
                    }}
                >
                    <div className="absolute inset-6 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                        <span className="text-2xl font-black text-slate-800">{total}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{t.dashboard.attendancePie.total}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-8 w-full px-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span>{t.dashboard.attendancePie.onTime}</span>
                        </div>
                        <span className="text-slate-400">{onTime} ({onTimePct.toFixed(0)}%)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span>{t.dashboard.attendancePie.late}</span>
                        </div>
                        <span className="text-slate-400">{late} ({latePct.toFixed(0)}%)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span>{t.dashboard.attendancePie.absent}</span>
                        </div>
                        <span className="text-slate-400">{absent} ({absentPct.toFixed(0)}%)</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            {/* Header Section */}
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">{t.dashboard.title}</h2>
                    <p className="text-slate-500">{t.dashboard.subtitle}</p>
                </div>
            </div>

            {/* Personal Stats for Employee */}
            {stats.personalStats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">{t.dashboard.personal.attendance.title}</CardTitle>
                            <CalendarCheck className="h-4 w-4 text-slate-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? "..." : `${stats.personalStats.attendanceCount} ${t.dashboard.personal.attendance.unit}`}</div>
                            <p className="text-xs text-slate-500 mt-1">
                                {t.dashboard.personal.attendance.desc}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">{t.dashboard.personal.leave.title}</CardTitle>
                            <Hourglass className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{loading ? "..." : `${stats.personalStats.leaveBalance} ${t.dashboard.personal.leave.unit}`}</div>
                            <p className="text-xs text-slate-500 mt-1">
                                {t.dashboard.personal.leave.desc}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">{t.dashboard.personal.status.title}</CardTitle>
                            <UserCircle className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{loading ? "..." : stats.personalStats.todayStatus}</div>
                            <p className="text-xs text-slate-500 mt-1">
                                {t.dashboard.personal.status.desc}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">{t.dashboard.personal.salary.title}</CardTitle>
                            <Banknote className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{loading ? "..." : formatCurrency(stats.personalStats.baseSalary)}</div>
                            <p className="text-xs text-slate-500 mt-1">
                                {t.dashboard.personal.salary.desc}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}


            {/* Fallback UI */}
            {(!loading && (user?.role === 'EMPLOYEE' || user?.role === 'STAFF') && !stats.personalStats) && (
                <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800">
                    <h3 className="font-semibold">{t.dashboard.personal.noData.title}</h3>
                    <p className="text-sm mt-1">
                        {t.dashboard.personal.noData.desc}
                    </p>
                </div>
            )}

            {/* Stats Grid - Only show for ADMIN/SUPERADMIN */}
            {['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER'].includes(user?.role || '') && (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">{t.dashboard.stats.employees.title}</CardTitle>
                                <Users className="h-4 w-4 text-slate-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? "..." : stats.totalEmployees}</div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {t.dashboard.stats.employees.desc}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">{t.dashboard.stats.departments.title}</CardTitle>
                                <Building2 className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-primary">{loading ? "..." : stats.departments.total}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                                        {stats.departments.active} {t.dashboard.stats.departments.active}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        / {stats.departments.total} {t.dashboard.stats.departments.total}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">{t.dashboard.stats.positions.title}</CardTitle>
                                <Briefcase className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{loading ? "..." : stats.positions.total}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                        {stats.positions.active} {t.dashboard.stats.positions.active}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        / {stats.positions.total} {t.dashboard.stats.positions.total}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">{t.dashboard.stats.attendance.title}</CardTitle>
                                <Clock className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{loading ? "..." : stats.presentToday}</div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {t.dashboard.stats.attendance.desc}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">{t.dashboard.stats.payroll.title}</CardTitle>
                                <Banknote className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-green-700 tracking-tight">{loading ? "..." : formatCurrency(stats.totalPayroll)}</div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {t.dashboard.stats.payroll.desc}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* Attendance Chart & Recent Activity Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Chart Area */}
                <Card className={cn(
                    "shadow-sm border-slate-200",
                    ['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER'].includes(user?.role || '') ? "col-span-4" : "col-span-7"
                )}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-slate-800">{t.dashboard.attendanceChart.title}</CardTitle>
                            <CardDescription>{t.dashboard.attendanceChart.desc}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setChartRange('week')}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                    chartRange === 'week'
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {t.dashboard.attendanceChart.rangeWeek || "Seminggu"}
                            </button>
                            <button
                                onClick={() => setChartRange('month')}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                    chartRange === 'month'
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {t.dashboard.attendanceChart.rangeMonth || "Sebulan"}
                            </button>
                            <button
                                onClick={() => setChartRange('year')}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                    chartRange === 'year'
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {t.dashboard.attendanceChart.rangeYear || "1 Tahun"}
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-[300px] w-full bg-white relative flex flex-col">
                            {loading ? (
                                <div className="flex-1 flex items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-400">
                                    {t.common.loading}
                                </div>
                            ) : stats.attendanceChart.length > 0 ? (
                                <div className="flex-1 flex flex-col justify-end relative">
                                    {/* Chart Area with Y-Axis */}
                                    <div className="h-[220px] w-full relative mb-8 ml-6">
                                        {/* Y-Axis Labels */}
                                        <div className="absolute -left-8 top-0 bottom-0 w-6 flex flex-col justify-between text-[9px] text-slate-400 font-medium text-right select-none py-[-2px]">
                                            {chartLabels.map((val, i) => (
                                                <span key={i} className="leading-none transform -translate-y-1/2">{val}</span>
                                            ))}
                                        </div>

                                        {/* Grid Lines */}
                                        {chartLabels.map((val, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-full border-t border-slate-100/80"
                                                style={{ bottom: `${(val / chartScaleMax) * 100}%`, left: 0 }}
                                            />
                                        ))}

                                        {/* Bar Chart Layer */}
                                        <div className="absolute inset-0 z-10 flex items-end justify-between gap-[2%] pl-2 pr-2">
                                            {stats.attendanceChart.map((day, idx) => {
                                                const present = day.present || 0;
                                                const late = day.late || 0;
                                                const total = present + late;

                                                const presentPct = (present / chartScaleMax) * 100;
                                                const latePct = (late / chartScaleMax) * 100;
                                                const totalPct = presentPct + latePct;
                                                const isZero = total === 0;

                                                return (
                                                    <div key={idx} className="group relative flex flex-1 flex-col justify-end items-center h-full">
                                                        {/* Tooltip */}
                                                        <div
                                                            className="absolute opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 mb-2 transform translate-y-2 group-hover:translate-y-0 bottom-full"
                                                            style={{ bottom: isZero ? '0%' : `${totalPct}%` }}
                                                        >
                                                            <div className="bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap flex flex-col items-center gap-1 z-50">
                                                                <div className="font-bold border-b border-slate-700 pb-1 mb-0.5 w-full text-center">{day.date}</div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                                    <span>Hadir: {present}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                                    <span>Telat: {late}</span>
                                                                </div>
                                                            </div>
                                                            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-slate-900 mx-auto mt-[-1px]"></div>
                                                        </div>

                                                        {/* Stacked Bar container */}
                                                        <div
                                                            className="w-full max-w-[40px] flex flex-col-reverse justify-start relative group-hover:shadow-lg transition-all duration-300 rounded-t-sm overflow-hidden"
                                                            style={{
                                                                height: isZero ? '4px' : `${totalPct}%`,
                                                                background: isZero ? 'rgb(241 245 249)' : 'transparent' // slate-100 if zero
                                                            }}
                                                        >
                                                            {/* Present Segment (Bottom - but flex-col-reverse makes it visual bottom if we structure right, wait. flex-col-reverse puts first child at bottom. So Present first.) */}

                                                            {/* Actually flex-col-reverse: First item is at bottom. */}
                                                            {/* So I put Present first. */}

                                                            {!isZero && (
                                                                <>
                                                                    <div
                                                                        className="w-full bg-emerald-500/90 group-hover:bg-emerald-500 transition-colors"
                                                                        style={{ height: `${(present / total) * 100}%` }}
                                                                    />
                                                                    <div
                                                                        className="w-full bg-amber-400/90 group-hover:bg-amber-400 transition-colors"
                                                                        style={{ height: `${(late / total) * 100}%` }}
                                                                    />
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Label */}
                                                        <span className="absolute -bottom-7 text-[10px] font-bold text-slate-400 group-hover:text-primary transition-colors text-center w-full truncate px-0.5">
                                                            {day.date}
                                                        </span>

                                                        {/* Hover Hit Area */}
                                                        <div className="absolute inset-0 z-0 bg-transparent" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-400">
                                    {t.dashboard.attendanceChart.placeholder}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER'].includes(user?.role || '') && (
                    <Card className="col-span-3 shadow-sm border-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-slate-800">{t.dashboard.attendancePie.title}</CardTitle>
                            <CardDescription>{t.dashboard.attendancePie.desc}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AttendancePieChart data={stats.todayAttendance} loading={loading} />
                        </CardContent>
                    </Card>
                )}

                {/* Recent Activity / Employees - Only for ADMIN */}
                {['ADMIN', 'SUPERADMIN', 'COMPANY_OWNER'].includes(user?.role || '') && (
                    <Card className="col-span-7 shadow-sm border-slate-200 mt-4">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-slate-800">{t.dashboard.recentEmployees.title}</CardTitle>
                            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/5 transition-all p-0 h-auto">
                                <Link href="/dashboard/users/employees" className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider">
                                    {t.common.viewMore || "Lihat Lainnya"}
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {loading ? (
                                    <p>{t.common.loading}</p>
                                ) : stats.recentEmployees.length === 0 ? (
                                    <p className="text-sm text-slate-500">{t.dashboard.recentEmployees.empty}</p>
                                ) : (
                                    stats.recentEmployees.map((emp) => (
                                        <div key={emp.id} className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group">
                                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-2 ring-transparent group-hover:ring-primary/10 transition-all">
                                                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} alt="Avatar" />
                                                <AvatarFallback>U</AvatarFallback>
                                            </Avatar>
                                            <div className="ml-4 flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate">{emp.name}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight truncate">{emp.position || t.dashboard.recentEmployees.noPosition}</p>
                                            </div>
                                            <div className="text-[10px] font-black bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-100 text-green-600 ml-2 whitespace-nowrap">
                                                {new Date(emp.joinDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
