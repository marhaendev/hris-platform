'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { PublicNavbar } from "@/components/public-navbar";

export default function PrivacyPage() {
    const lastUpdated = "8 Januari 2026";

    return (
        <div className="min-h-screen bg-slate-50">
            <PublicNavbar />

            <main className="max-w-4xl mx-auto px-6 py-24">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    {/* Header Header */}
                    <div className="bg-primary px-8 py-16 md:px-16 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/20 text-white mb-6 backdrop-blur-md">
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 font-headline">
                                Kebijakan Privasi
                            </h1>
                            <p className="text-white/70 font-medium">
                                Komitmen kami terhadap keamanan data Anda.
                            </p>
                            <p className="text-white/50 text-xs mt-2">
                                Terakhir diperbarui: {lastUpdated}
                            </p>
                        </div>
                    </div>

                    <div className="p-8 md:p-16 prose prose-slate max-w-none">
                        <p className="text-lg text-slate-600 leading-relaxed font-medium">
                            HRIS sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi karyawan serta perusahaan Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan menjaga informasi Anda.
                        </p>

                        <div className="grid gap-12 mt-12">
                            <section>
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-4 font-headline">
                                    <Shield className="h-6 w-6 text-primary" />
                                    Data yang Kami Kumpulkan
                                </h2>
                                <p className="text-slate-600 leading-relaxed mb-4">
                                    Kami mengumpulkan informasi identitas (nama, email), data pekerjaan karyawan, data kehadiran (termasuk lokasi GPS saat check-in), dan informasi payroll yang Anda masukkan ke dalam sistem.
                                </p>
                            </section>

                            <section>
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-4 font-headline">
                                    <Lock className="h-6 w-6 text-primary" />
                                    Keamanan Data
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Semua data Anda disimpan di server terenkripsi. Kami menggunakan protokol industri standar (SSL/TLS) untuk mengamankan transfer data dan melakukan backup rutin untuk mencegah kehilangan data.
                                </p>
                            </section>

                            <section>
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-4 font-headline">
                                    <Eye className="h-6 w-6 text-primary" />
                                    Penggunaan Informasi
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Data Anda hanya digunakan untuk menyediakan layanan HRIS, seperti rekap absensi dan notifikasi sistem. Kami tidak akan menjual atau membagikan data pribadi Anda kepada pihak ketiga untuk tujuan pemasaran.
                                </p>
                            </section>

                            <section>
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-4 font-headline">
                                    <ShieldCheck className="h-6 w-6 text-primary" />
                                    Hak Anda
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Anda memiliki hak untuk mengakses, memperbaiki, atau menghapus data Anda kapan saja melalui panel admin atau dengan menghubungi tim bantuan kami.
                                </p>
                            </section>
                        </div>

                        <div className="mt-16 p-8 bg-slate-50 rounded-3xl border border-slate-100 text-slate-600">
                            <h3 className="text-lg font-black text-slate-900 mb-2">Punya Pertanyaan Lain?</h3>
                            <p className="font-medium">Kami siap membantu memastikan data Anda tetap aman. Hubungi tim privasi kami di privacy@hasanaskari.com</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 text-slate-500 hover:text-primary font-bold">
                            <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
