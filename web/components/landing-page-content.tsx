'use client';

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Zap, Users, BarChart3, Calendar, DollarSign, Clock, CreditCard, ArrowUpRight, MessageCircle, ClipboardCheck, Sparkles } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { PublicNavbar } from "@/components/public-navbar";
import { PublicFooter } from "@/components/public-footer";

interface LandingPageContentProps {
    faqs: any[];
}

export function LandingPageContent({ faqs }: LandingPageContentProps) {
    const { t, language } = useLanguage();
    const [activePopup, setActivePopup] = useState<'overview' | 'employees' | 'attendance' | 'payroll' | 'recruitment'>('overview');
    const [cycleCount, setCycleCount] = useState(1);

    const menuItems = [
        { id: 'overview', icon: Zap, label: 'Overview' },
        { id: 'employees', icon: Users, label: 'Employees' },
        { id: 'attendance', icon: Clock, label: 'Attendance' },
        { id: 'payroll', icon: DollarSign, label: 'Payroll' },
        { id: 'recruitment', icon: ClipboardCheck, label: 'Recruitment' },
    ] as const;

    // Dynamic auto-cycle: Ramp up speed from 1s to 5s over first 5 steps
    useEffect(() => {
        const intervalTime = Math.min(cycleCount, 5) * 1000;

        const timer = setTimeout(() => {
            setActivePopup((current) => {
                const currentIndex = menuItems.findIndex(item => item.id === current);
                const nextIndex = (currentIndex + 1) % menuItems.length;
                return menuItems[nextIndex].id;
            });
            setCycleCount(prev => prev + 1);
        }, intervalTime);

        return () => clearTimeout(timer);
    }, [activePopup, cycleCount]);

    // Handle hash-free smooth scroll from redirection
    useEffect(() => {
        const targetId = localStorage.getItem('hriz_scroll_target');
        if (targetId) {
            // Small timeout to ensure page is rendered before scrolling
            const timer = setTimeout(() => {
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                localStorage.removeItem('hriz_scroll_target');
            }, 100);
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/20 selection:text-primary">
            <PublicNavbar />

            {/* Hero */}
            <section className="relative pt-32 pb-32 overflow-hidden bg-slate-50">
                {/* Background Decoration - Removed bg-slate-50 to avoid masking, increased z-index to 0 */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    {/* High Contrast Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:40px_40px] opacity-70 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_90%,transparent_100%)]"></div>

                    {/* Bold Gradient Blobs */}
                    <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-primary/15 via-cyan-500/10 to-transparent"></div>
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/40 blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[0%] -right-[10%] w-[40%] h-[60%] rounded-full bg-cyan-400/30 blur-[80px] animate-pulse delay-1000"></div>

                    {/* HR Themed Decorative Icons */}
                    <div className="absolute top-20 left-10 text-yellow-500/40 animate-float">
                        <Calendar className="w-32 h-32 rotate-12 opacity-50" />
                    </div>
                    <div className="absolute bottom-20 right-10 text-pink-500/40 animate-float-delayed">
                        <MessageCircle className="w-40 h-40 -rotate-12 opacity-50" />
                    </div>

                    {/* Floating Icons/Shapes */}
                    <div className="absolute top-[15%] left-[15%] text-teal-600/30">
                        <ClipboardCheck className="w-24 h-24" />
                    </div>
                    <div className="absolute top-[25%] right-[20%] text-cyan-600/40 animate-bounce-slow">
                        <DollarSign className="w-16 h-16" />
                    </div>
                    <div className="absolute bottom-[30%] left-[8%] text-purple-600/30 animate-float">
                        <Users className="w-20 h-20" />
                    </div>
                    <div className="absolute top-[40%] right-[5%] text-emerald-600/40 animate-pulse">
                        <Clock className="w-12 h-12" />
                    </div>

                    {/* Extra depth blob */}
                    <div className="absolute top-[40%] left-[20%] w-[35%] h-[35%] rounded-full bg-indigo-500/20 blur-[90px] animate-float-slow"></div>
                </div>

                <div className="container mx-auto px-4 text-center max-w-6xl relative z-10">
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-fade-in-up">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-lg font-semibold text-slate-600">{t.landing.hero.badge}</span>
                    </div>

                    <div className="relative mx-auto max-w-5xl mb-8 animate-fade-in-up delay-100">
                        <div className="grid grid-cols-1 grid-rows-1 justify-items-center overflow-visible pt-2 pb-14 px-4 -mb-12">
                            {/* Bottom Layer: The "Stroke" (White Text + White Shadow) */}
                            <h1 className="col-start-1 row-start-1 text-5xl md:text-7xl font-medium tracking-tight leading-relaxed font-headline whitespace-pre-line pb-4 text-white text-stroke-white select-none pointer-events-none">
                                {t.landing.hero.title}
                            </h1>

                            {/* Top Layer: The "Fill" (Gradient Text) */}
                            <h1 className="col-start-1 row-start-1 text-5xl md:text-7xl font-medium bg-gradient-to-r from-primary to-cyan-600 bg-clip-text text-transparent tracking-tight leading-relaxed font-headline whitespace-pre-line pb-4 relative z-10">
                                {t.landing.hero.title}
                            </h1>
                        </div>
                    </div>

                    <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
                        {t.landing.hero.description}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
                        <Link href="/login">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300 font-headline">
                                {t.landing.hero.cta_primary} <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* Simple Dashboard Mockup */}
                    <div className="mt-20 relative mx-auto max-w-5xl animate-fade-in-up delay-500 hidden md:block">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-cyan-400 rounded-[2rem] blur opacity-30"></div>
                        <div className="relative rounded-[1.7rem] bg-white p-2 ring-1 ring-slate-200 shadow-2xl">
                            <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 aspect-[16/9] md:aspect-[21/9] relative">
                                {/* Decor Mockup Content */}
                                <div className="absolute inset-0 bg-white/50 flex items-center justify-center p-8">
                                    <div className="w-full h-full border border-slate-200 border-dashed rounded-xl flex items-center justify-center text-slate-400 font-mono text-sm relative overflow-hidden group hover:border-primary/50 transition-colors duration-500">


                                        {/* Center UI Abstract (Structured Layout) */}
                                        <div className="flex w-full h-full gap-6 transition duration-500">
                                            {/* Fake Sidebar */}
                                            <div className="hidden md:flex w-20 lg:w-48 flex-col gap-3 border-r border-slate-100 bg-white py-6 px-3">
                                                <div className="flex items-center gap-3 px-2 mb-4">
                                                    <div className="h-8 w-8 bg-primary rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30">H</div>
                                                    <div className="h-4 w-20 bg-slate-100 rounded hidden lg:block"></div>
                                                </div>
                                                <div className="space-y-1">
                                                    {menuItems.map((item) => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => setActivePopup(item.id)}
                                                            className={`h-9 w-full rounded-lg ${activePopup === item.id ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-transparent text-slate-400 hover:bg-slate-50'} flex items-center gap-3 px-3 transition-all duration-300 group/item`}
                                                        >
                                                            <item.icon className={`h-4 w-4 ${activePopup === item.id ? 'text-primary' : 'text-slate-300 group-hover/item:text-slate-500'}`} />
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider hidden lg:block ${activePopup === item.id ? 'text-primary' : 'text-slate-400'}`}>
                                                                {item.label}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Fake Main Content */}
                                            <div className="flex-1 py-6 pr-6 space-y-6 flex flex-col">
                                                {/* Header */}
                                                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-50 shadow-sm">
                                                    <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
                                                    <div className="flex gap-2">
                                                        <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
                                                        <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
                                                    </div>
                                                </div>

                                                {/* Stats Grid - Interactive */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <button
                                                        onClick={() => setActivePopup('employees')}
                                                        className={`h-24 bg-white rounded-xl border transition-all duration-300 shadow-sm p-4 flex flex-col justify-between text-left group/card ${activePopup === 'employees' ? 'border-primary ring-1 ring-primary/20' : 'border-slate-100 hover:border-primary/50'}`}
                                                    >
                                                        <div className="h-8 w-8 bg-slate-50 rounded-lg mb-2 flex items-center justify-center text-slate-400 group-hover/card:text-primary transition-colors">
                                                            <Users className="h-4 w-4" />
                                                        </div>
                                                        <div className="space-y-1 text-slate-600">
                                                            <div className="h-2 w-12 bg-slate-200 rounded"></div>
                                                            <div className="h-4 w-16 bg-slate-300 rounded"></div>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => setActivePopup('attendance')}
                                                        className={`h-24 bg-white rounded-xl border transition-all duration-300 shadow-sm p-4 flex flex-col justify-between text-left group/card ${activePopup === 'attendance' ? 'border-primary ring-1 ring-primary/20' : 'border-slate-100 hover:border-primary/50'}`}
                                                    >
                                                        <div className="h-8 w-8 bg-slate-50 rounded-lg mb-2 flex items-center justify-center text-slate-400 group-hover/card:text-primary transition-colors">
                                                            <Clock className="h-4 w-4" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="h-2 w-12 bg-slate-200 rounded"></div>
                                                            <div className="h-4 w-16 bg-slate-300 rounded"></div>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => setActivePopup('payroll')}
                                                        className={`h-24 bg-white rounded-xl border transition-all duration-300 shadow-sm p-4 flex flex-col justify-between text-left group/card ${activePopup === 'payroll' ? 'border-primary ring-1 ring-primary/20' : 'border-slate-100 hover:border-primary/50'}`}
                                                    >
                                                        <div className="h-8 w-8 bg-slate-50 rounded-lg mb-2 flex items-center justify-center text-slate-400 group-hover/card:text-primary transition-colors">
                                                            <DollarSign className="h-4 w-4" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="h-2 w-12 bg-slate-200 rounded"></div>
                                                            <div className="h-4 w-16 bg-slate-300 rounded"></div>
                                                        </div>
                                                    </button>
                                                </div>

                                                {/* Activity List/Table */}
                                                <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3 overflow-hidden">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                                        <div className="h-4 w-12 bg-slate-100 rounded"></div>
                                                    </div>
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className="flex items-center gap-4 bg-slate-50/50 p-2 rounded-lg border border-slate-50">
                                                            <div className="h-8 w-8 bg-slate-200 rounded-full flex-shrink-0"></div>
                                                            <div className="space-y-1.5 flex-1">
                                                                <div className="h-3 w-1/3 bg-slate-300 rounded"></div>
                                                                <div className="h-2 w-1/4 bg-slate-200 rounded"></div>
                                                            </div>
                                                            <div className="h-6 w-16 bg-slate-100 rounded-md"></div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Dynamic Floating Popups - Always on top */}
                                                <div className="absolute inset-0 pointer-events-none z-50">
                                                    {/* 1. Overview / Balance (Default) */}
                                                    <div className={`absolute top-8 right-8 transition-all duration-500 transform ${activePopup === 'overview' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}>
                                                        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-2xl w-64 ring-1 ring-slate-200/50 pointer-events-auto">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t.landing.hero.dashboard_mockup.balance}</span>
                                                                <CreditCard className="text-primary h-4 w-4" />
                                                            </div>
                                                            <div className="text-2xl font-bold text-slate-800 mb-1">Rp 12.500.000</div>
                                                            <div className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                                                                <ArrowUpRight className="h-3 w-3" /> +15% {t.time.monthsAgo}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 2. Recruitment / Hiring */}
                                                    <div className={`absolute bottom-10 right-10 transition-all duration-500 transform ${activePopup === 'recruitment' || activePopup === 'overview' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
                                                        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/60 w-56 ring-1 ring-slate-200/50 pointer-events-auto">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                                                    <DollarSign className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-slate-500 text-[10px] font-bold uppercase">{t.landing.hero.dashboard_mockup.hiring}</div>
                                                                    <div className="text-slate-900 font-bold">Senior FE Dev</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex -space-x-2 overflow-hidden pl-1">
                                                                {[1, 2, 3].map(i => (
                                                                    <div key={i} className={`inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200`} />
                                                                ))}
                                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold ring-2 ring-white">+5</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 3. Employees Popup */}
                                                    <div className={`absolute top-32 right-12 transition-all duration-500 transform ${activePopup === 'employees' ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-95 pointer-events-none'}`}>
                                                        <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-white/60 w-72 ring-1 ring-slate-200/50 pointer-events-auto">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                                                    <Users className="h-6 w-6" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-2xl font-bold text-slate-900">1,248</div>
                                                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Total Active Staff</div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-slate-600 font-medium">Headquarters</span>
                                                                    <span className="text-slate-900 font-bold px-2 py-0.5 bg-slate-100 rounded-full">842</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-slate-600 font-medium">Remote Offices</span>
                                                                    <span className="text-slate-900 font-bold px-2 py-0.5 bg-slate-100 rounded-full">406</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 4. Attendance Popup */}
                                                    <div className={`absolute top-32 left-32 transition-all duration-500 transform ${activePopup === 'attendance' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95 pointer-events-none'}`}>
                                                        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-white/60 w-64 ring-1 ring-slate-200/50 pointer-events-auto">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="text-sm font-bold text-slate-800">Attendance Info</div>
                                                                <Clock className="h-4 w-4 text-emerald-500" />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="p-3 bg-emerald-50 rounded-2xl flex items-center justify-between">
                                                                    <span className="text-emerald-700 font-bold text-xs">Present</span>
                                                                    <span className="text-emerald-800 font-black text-lg">94%</span>
                                                                </div>
                                                                <div className="p-3 bg-red-50 rounded-2xl flex items-center justify-between">
                                                                    <span className="text-red-700 font-bold text-xs">Late</span>
                                                                    <span className="text-red-800 font-black text-lg">2.5%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 5. Payroll Popup */}
                                                    <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 transition-all duration-500 transform ${activePopup === 'payroll' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
                                                        <div className="bg-white/95 backdrop-blur-md p-6 rounded-[2.5rem] shadow-2xl border border-white/60 w-80 ring-1 ring-slate-200/50 pointer-events-auto">
                                                            <div className="flex items-center gap-4 mb-4">
                                                                <div className="h-14 w-14 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 shadow-inner">
                                                                    <Calendar className="h-7 w-7" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Next Payday</div>
                                                                    <div className="text-slate-900 font-black text-xl">25 January 2026</div>
                                                                </div>
                                                            </div>
                                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full w-[70%] bg-amber-400 rounded-full shadow-lg transition-all duration-1000 delay-500"></div>
                                                            </div>
                                                            <div className="mt-2 text-[10px] text-slate-400 font-bold text-right tracking-tighter italic">Process status: 70% Completed</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24 bg-white">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <div className="grid grid-cols-1 grid-rows-1 justify-items-center overflow-visible pt-2 pb-14 px-4 -mb-12">
                            {/* Bottom Layer: The "Stroke" */}
                            <h2 className="col-start-1 row-start-1 text-2xl md:text-3xl lg:text-4xl font-medium font-headline text-white text-stroke-white select-none pointer-events-none leading-relaxed pb-4 md:whitespace-nowrap">
                                {t.landing.features.title}
                            </h2>
                            {/* Top Layer: The "Fill" (Gradient) */}
                            <h2 className="col-start-1 row-start-1 text-2xl md:text-3xl lg:text-4xl font-medium bg-gradient-to-r from-primary to-cyan-600 bg-clip-text text-transparent font-headline relative z-10 leading-relaxed pb-4 md:whitespace-nowrap">
                                {t.landing.features.title}
                            </h2>
                        </div>
                        <p className="text-xl text-slate-600">{t.landing.features.subtitle}</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* 1. Employees */}
                        <div className="group p-8 rounded-3xl border border-slate-100 hover:border-primary/20 bg-slate-50 hover:bg-primary/5 transition duration-300">
                            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">{t.landing.features.employees.title}</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {t.landing.features.employees.desc}
                            </p>
                        </div>

                        {/* 2. Attendance */}
                        <div className="group p-8 rounded-3xl border border-slate-100 hover:border-primary/20 bg-slate-50 hover:bg-primary/5 transition duration-300">
                            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition">
                                <Zap className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">{t.landing.features.attendance.title}</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {t.landing.features.attendance.desc}
                            </p>
                        </div>

                        {/* 3. Payroll */}
                        <div className="group p-8 rounded-3xl border border-slate-100 hover:border-primary/20 bg-slate-50 hover:bg-primary/5 transition duration-300">
                            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">{t.landing.features.payroll.title}</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {t.landing.features.payroll.desc}
                            </p>
                        </div>

                        {/* 4. Cuti & Izin */}
                        <div className="group p-8 rounded-3xl border border-slate-100 hover:border-primary/20 bg-slate-50 hover:bg-primary/5 transition duration-300">
                            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">{t.landing.features.leave.title}</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {t.landing.features.leave.desc}
                            </p>
                        </div>

                        {/* 5. Dashboard */}
                        <div className="group p-8 rounded-3xl border border-slate-100 hover:border-primary/20 bg-slate-50 hover:bg-primary/5 transition duration-300">
                            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">{t.landing.features.dashboard.title}</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {t.landing.features.dashboard.desc}
                            </p>
                        </div>

                        {/* 6. WhatsApp */}
                        <div className="group p-8 rounded-3xl border border-slate-100 hover:border-primary/20 bg-slate-50 hover:bg-primary/5 transition duration-300">
                            <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition">
                                <MessageCircle className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">{t.landing.features.whatsapp.title}</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {t.landing.features.whatsapp.desc}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}


            {/* FAQ */}
            <section id="faq" className="py-24 bg-slate-50 relative overflow-hidden">
                {/* Background Grid & Blobs */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_90%,transparent_100%)]"></div>

                    {/* Bold Gradient Blobs - Matches Hero */}
                    <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-primary/5 via-cyan-500/5 to-transparent"></div>
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[0%] -right-[10%] w-[40%] h-[60%] rounded-full bg-cyan-400/10 blur-[80px] animate-pulse delay-1000"></div>
                </div>

                <div className="container mx-auto px-4 max-w-3xl relative z-10">
                    <div className="grid grid-cols-1 grid-rows-1 justify-items-center overflow-visible pt-2 pb-14 px-4 -mb-12">
                        {/* Bottom Layer: The "Stroke" */}
                        <h2 className="col-start-1 row-start-1 text-2xl md:text-3xl lg:text-4xl font-medium font-headline text-white text-stroke-white select-none pointer-events-none text-center leading-relaxed pb-4 md:whitespace-nowrap">
                            {t.landing.faq.title}
                        </h2>
                        {/* Top Layer: The "Fill" (Gradient) */}
                        <h2 className="col-start-1 row-start-1 text-2xl md:text-3xl lg:text-4xl font-medium bg-gradient-to-r from-primary to-cyan-600 bg-clip-text text-transparent font-headline relative z-10 text-center leading-relaxed pb-4 md:whitespace-nowrap">
                            {t.landing.faq.title}
                        </h2>
                    </div>
                    <p className="text-center text-slate-600 mb-12">{t.landing.faq.subtitle}</p>

                    <Accordion type="single" collapsible className="w-full mb-10">
                        {faqs.map((faq: any) => {
                            const question = language === 'en' ? (faq.question_en || faq.question) : (faq.question_id || faq.question);
                            const answer = language === 'en' ? (faq.answer_en || faq.answer) : (faq.answer_id || faq.answer);

                            return (
                                <AccordionItem key={faq.id} value={`item-${faq.id}`}>
                                    <AccordionTrigger className="text-left font-semibold text-slate-900">{question}</AccordionTrigger>
                                    <AccordionContent className="text-slate-600 leading-relaxed">
                                        {answer}
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>

                    <div className="text-center">
                        <Link href="/faq">
                            <Button variant="outline" size="lg" className="gap-2 rounded-full px-8 font-headline">
                                {t.landing.faq.view_all} <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}
