import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import db from "@/lib/db";
import { PublicNavbar } from "@/components/public-navbar";
import { PublicFooter } from "@/components/public-footer";
import { FAQList } from "@/components/faq-list";

export default function FAQPage() {
    // Fetch all FAQs (Server Side)
    const faqs = db.prepare('SELECT * FROM FAQ WHERE is_active = 1 ORDER BY display_order ASC').all() as any[];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-32 pb-16 bg-white border-b relative">
                <div className="container mx-auto px-4 max-w-4xl text-center pb-8">
                    <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 mb-6">
                        <HelpCircle className="h-3 w-3 mr-1" /> Pusat Bantuan
                    </div>
                    <div className="grid grid-cols-1 grid-rows-1 justify-items-center overflow-visible pt-2 pb-14 px-4 -mb-12">
                        {/* Bottom Layer: The "Stroke" */}
                        <h1 className="col-start-1 row-start-1 text-3xl md:text-4xl lg:text-5xl font-medium font-headline text-white text-stroke-white select-none pointer-events-none leading-relaxed pb-4 md:whitespace-nowrap">
                            Pertanyaan Umum
                        </h1>
                        {/* Top Layer: The "Fill" (Gradient) */}
                        <h1 className="col-start-1 row-start-1 text-3xl md:text-4xl lg:text-5xl font-medium bg-gradient-to-r from-primary to-cyan-600 bg-clip-text text-transparent font-headline relative z-10 leading-relaxed pb-4 md:whitespace-nowrap">
                            Pertanyaan Umum
                        </h1>
                    </div>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Temukan jawaban untuk pertanyaan seputar fitur, harga, dan teknis HRIS di sini.
                    </p>
                </div>
            </section>

            {/* FAQ Search & List */}
            <section className="py-8 pb-20">
                <div className="container mx-auto px-4 max-w-3xl">
                    <FAQList faqs={faqs} />
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}
