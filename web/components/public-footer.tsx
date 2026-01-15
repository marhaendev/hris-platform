'use client';

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/contexts/LanguageContext";

export function PublicFooter() {
    const { t } = useLanguage();

    return (
        <footer className="bg-slate-50 text-slate-500 pt-16 pb-16 relative">
            {/* Diagonal Lines Divider */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-[repeating-linear-gradient(-45deg,#e2e8f0,#e2e8f0_2px,transparent_2px,transparent_8px)] opacity-60"></div>

            <div className="container mx-auto px-4 max-w-7xl pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="relative h-12 w-32 opacity-90">
                            <Image
                                src="/logo.png"
                                alt="HRIS Logo"
                                fill
                                className="object-contain object-left"
                            />
                        </div>
                        <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
                            {t.landing.footer.desc}
                        </p>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-slate-900 font-bold mb-6 uppercase text-xs tracking-widest">{t.landing.footer.support_title}</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/about" className="hover:text-primary transition">{t.landing.footer.about}</Link></li>
                            <li><Link href="/faq" className="hover:text-primary transition">{t.landing.nav.faq}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                    <div className="flex flex-col md:flex-row items-center gap-2">
                        <p>&copy; {new Date().getFullYear()} {t.landing.footer.copyright}. {t.landing.footer.rights}</p>
                        <span className="hidden md:inline text-slate-300 mx-2">|</span>
                        <p>
                            {t.landing.footer.created_by} <a href="https://hasanaskari.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors font-medium text-slate-700">hasanaskari.com</a>
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-primary transition">{t.landing.footer.privacy}</Link>
                        <Link href="/terms" className="hover:text-primary transition">{t.landing.footer.terms}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
