'use client';

import { PublicNavbar } from "@/components/public-navbar";
import { PublicFooter } from "@/components/public-footer";
import { useLanguage } from "@/lib/contexts/LanguageContext";

export default function AboutPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/20 selection:text-primary">
            <PublicNavbar />

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold font-headline text-slate-900 mb-6">
                            {t.landing.about.title}
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            {t.landing.about.subtitle}
                        </p>
                    </div>

                    {/* Content Cards */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Mission */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <h2 className="text-2xl font-bold font-headline text-slate-900 mb-4 text-primary">
                                {t.landing.about.mission_title}
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                {t.landing.about.mission_desc}
                            </p>
                        </div>

                        {/* Story */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <h2 className="text-2xl font-bold font-headline text-slate-900 mb-4 text-cyan-600">
                                {t.landing.about.story_title}
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                {t.landing.about.story_desc}
                            </p>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="mt-16 text-center animate-fade-in-up delay-200">
                        <h2 className="text-2xl font-bold font-headline text-slate-900 mb-4">
                            {t.landing.about.contact_title}
                        </h2>
                        <p className="text-slate-600 mb-6">
                            {t.landing.about.contact_desc}
                        </p>
                        <a
                            href="mailto:hasanaskari@gmail.com"
                            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-primary rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                        >
                            hasanaskari@gmail.com
                        </a>
                    </div>

                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
