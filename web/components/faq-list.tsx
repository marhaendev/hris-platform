
"use client";

import { useState } from "react";
import { Search, HelpCircle, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
    id: number;
    question: string;
    answer: string;
    category?: string;
}

interface FAQListProps {
    faqs: FAQ[];
}

export function FAQList({ faqs }: FAQListProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter FAQs based on search query
    const filteredFaqs = faqs.filter((faq) => {
        const query = searchQuery.toLowerCase();
        return (
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query)
        );
    });

    // Group filtered FAQs by category
    const categories = Array.from(new Set(filteredFaqs.map((f) => f.category || 'General'))).sort();

    // Grouping helper
    const groupedFaqs = categories.reduce((acc, category) => {
        acc[category] = filteredFaqs.filter((f) => (f.category || 'General') === category);
        return acc;
    }, {} as Record<string, FAQ[]>);

    return (
        <div className="space-y-12">
            {/* Search Box */}
            <div className="max-w-xl mx-auto relative -mt-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                    placeholder="Cari pertanyaan... (misal: gaji, shift, error)"
                    className="pl-10 h-12 text-lg shadow-lg border-slate-200 focus-visible:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Results */}
            {filteredFaqs.length === 0 ? (
                <div className="text-center py-12">
                    <div className="bg-slate-50 inline-flex p-4 rounded-full mb-4">
                        <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Tidak ditemukan</h3>
                    <p className="text-slate-500">
                        Maaf, kami tidak menemukan jawaban untuk "{searchQuery}".
                        <br />Silakan coba kata kunci lain atau hubungi support kami.
                    </p>
                </div>
            ) : (
                <div className="space-y-12">
                    {categories.map((category) => (
                        <div key={category} className="scroll-mt-24" id={category.toLowerCase()}>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                {category === 'General' && <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><HelpCircle className="h-5 w-5" /></span>}
                                {category === 'Pricing' && <span className="bg-green-100 text-green-600 p-1.5 rounded-lg"><span className="font-bold text-sm">$</span></span>}
                                {category === 'Features' && <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg"><span className="h-5 w-5 block border-2 border-current rounded-sm" /></span>}
                                {category === 'Technical' && <span className="bg-orange-100 text-orange-600 p-1.5 rounded-lg"><span className="font-mono text-xs">{"</>"}</span></span>}
                                {category === 'Security' && <span className="bg-red-100 text-red-600 p-1.5 rounded-lg"><ShieldCheck className="h-5 w-5" /></span>}
                                {category}
                            </h2>

                            <Accordion type="single" collapsible className="w-full bg-white rounded-xl shadow-sm border px-6">
                                {groupedFaqs[category].map((faq: any) => (
                                    <AccordionItem key={faq.id} value={`item-${faq.id}`} className="border-b-slate-100 last:border-0">
                                        <AccordionTrigger className="text-left text-base font-semibold text-slate-800 py-4 hover:text-blue-600 transition-colors hover:no-underline">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-slate-600 leading-relaxed text-base pb-4">
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
