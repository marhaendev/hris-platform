'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, LogIn, UserPlus, Sparkles, HelpCircle } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useRouter, usePathname } from "next/navigation";

export function PublicNavbar() {
    const { t } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 2);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleNav = (id: string) => {
        if (pathname === '/') {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            localStorage.setItem('hriz_scroll_target', id);
            router.push('/');
        }
    };

    return (
        <nav
            className={`fixed z-50 transition-all duration-500 ease-in-out left-1/2 -translate-x-1/2 ${isScrolled
                ? "top-4 w-[90%] md:w-[700px] rounded-full bg-white/80 backdrop-blur-md shadow-lg ring-1 ring-slate-200/50 py-2 px-4"
                : "top-0 w-full bg-transparent border-transparent py-6 px-4"
                }`}
        >
            <div className={`flex items-center justify-between mx-auto transition-all ${isScrolled ? "max-w-full" : "container max-w-7xl"}`}>
                <div className="flex items-center gap-2">
                    {/* Mobile Menu Trigger */}
                    <div className="md:hidden mr-1">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-slate-100/50">
                                    <Menu className="h-6 w-6 text-slate-700" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="flex flex-col w-64 p-0 bg-white border-r-slate-200 h-full">
                                {/* Header with Logo */}
                                <div className="flex h-16 items-center px-6 border-b border-slate-100">
                                    <Link href="/" className="relative h-10 w-32">
                                        <Image
                                            src="/icon.png"
                                            alt="HRIS Logo"
                                            fill
                                            sizes="128px"
                                            className="object-contain object-left"
                                            priority
                                        />
                                    </Link>
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto py-6 px-3">
                                    {/* Navigation Links with Icons */}
                                    <nav className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleNav('features')}
                                            className="flex items-center gap-3 text-left text-sm px-4 py-2 text-slate-600 hover:text-primary hover:bg-slate-50 rounded-lg transition-all font-medium"
                                        >
                                            <Sparkles className="h-4 w-4 text-slate-500" />
                                            <span>{t.landing.nav.features}</span>
                                        </button>
                                        <button
                                            onClick={() => handleNav('faq')}
                                            className="flex items-center gap-3 text-left text-sm px-4 py-2 text-slate-600 hover:text-primary hover:bg-slate-50 rounded-lg transition-all font-medium"
                                        >
                                            <HelpCircle className="h-4 w-4 text-slate-500" />
                                            <span>{t.landing.nav.faq}</span>
                                        </button>
                                    </nav>
                                </div>

                                {/* Footer - Language & Login */}
                                <div className="border-t border-slate-100 p-4 relative">
                                    <div className="mb-4 flex items-center justify-between px-2">
                                        <span className="text-xs font-bold text-slate-400 tracking-wider font-ui">{t.common.changeLanguage || "Bahasa"}</span>
                                        <LanguageSwitcher mode="mobile" className="w-auto" size="small" />
                                    </div>

                                    {/* Login Button */}
                                    <Link href="/login" className="w-full block">
                                        <Button className="w-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white flex items-center gap-2 justify-center">
                                            <LogIn className="h-4 w-4" />
                                            {t.landing.nav.login}
                                        </Button>
                                    </Link>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
                        <div className={`relative transition-all duration-500 ${isScrolled ? "h-8 w-8" : "h-10 w-32"}`}>
                            <Image
                                src="/icon.png"
                                alt="HRIS Logo"
                                fill
                                sizes="(max-width: 768px) 32px, 128px"
                                className={`object-contain ${isScrolled ? "object-center" : "object-left"}`}
                                priority
                            />
                        </div>
                    </Link>
                </div>

                {/* Desktop Nav */}
                <div className={`hidden md:flex items-center transition-all duration-300 ${isScrolled
                    ? "gap-4 scale-95"
                    : "gap-8 bg-white/40 backdrop-blur-sm px-6 py-2 rounded-full border border-white/40 shadow-sm"
                    }`}>
                    <button onClick={() => handleNav('features')} className="text-sm font-semibold text-slate-700 hover:text-primary transition-colors">
                        {t.landing.nav.features}
                    </button>
                    <button onClick={() => handleNav('faq')} className="text-sm font-semibold text-slate-700 hover:text-primary transition-colors">
                        {t.landing.nav.faq}
                    </button>
                </div>

                <div className="hidden md:flex gap-2 items-center">
                    <div className={`${isScrolled ? "" : "bg-white/40 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/40 shadow-sm"}`}>
                        <LanguageSwitcher mode="desktop" />
                    </div>
                    {!isScrolled && <div className="w-px h-6 bg-slate-300/50 mx-1"></div>}

                    {/* Buttons transform to icons on scroll */}
                    <Link href="/login">
                        <Button
                            size={isScrolled ? "icon" : "default"}
                            className={`shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white font-headline transition-all duration-300 ${isScrolled ? "rounded-full w-9 h-9" : "text-base px-6 rounded-full"}`}
                            title={t.landing.nav.login}
                        >
                            {isScrolled ? <LogIn className="h-5 w-5" /> : t.landing.nav.login}
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
