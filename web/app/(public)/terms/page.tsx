'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Scale, ScrollText, FileText } from "lucide-react";
import { PublicNavbar } from "@/components/public-navbar";

export default function TermsPage() {
    const lastUpdated = "8 Januari 2026";

    return (
        <div className="min-h-screen bg-slate-50">
            <PublicNavbar />

            <main className="max-w-4xl mx-auto px-6 py-24">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    {/* Header Header */}
                    <div className="bg-slate-900 px-8 py-16 md:px-16 text-center">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/20 text-primary mb-6">
                            <ScrollText className="h-8 w-8" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 font-headline">
                            Syarat & Ketentuan
                        </h1>
                        <p className="text-slate-400 font-medium">
                            Terakhir diperbarui: {lastUpdated}
                        </p>
                    </div>

                    <div className="p-8 md:p-16 prose prose-slate max-w-none">
                        <p className="text-lg text-slate-600 leading-relaxed font-medium">
                            Selamat datang di HRIS. Mohon baca syarat dan ketentuan ini dengan saksama sebelum menggunakan platform kami. Dengan mendaftar atau menggunakan layanan HRIS, Anda setuju untuk terikat oleh ketentuan di bawah ini.
                        </p>

                        <div className="grid gap-12 mt-12">
                            <section>
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-4 font-headline">
                                    <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                                    Definisi Layanan
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    HRIS adalah platform sistem informasi manajemen sumber daya manusia (HRIS) berbasis cloud yang disediakan oleh hasanaskari.com. Layanan ini mencakup namun tidak terbatas pada manajemen karyawan, absensi, payroll, dan administrasi HR lainnya.
                                </p>
                            </section>

                            <section>
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-4 font-headline">
                                    <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                                    Akun Pengguna
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun dan password Anda. Setiap aktivitas yang terjadi di bawah akun Anda adalah tanggung jawab Anda sepenuhnya. Anda setuju untuk segera memberitahukan kami jika ada penggunaan akun yang tidak sah.
                                </p>
                            </section>



                            <section>
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-4 font-headline">
                                    <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">4</span>
                                    Penggunaan yang Diizinkan
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Anda dilarang menggunakan layanan kami untuk aktivitas ilegal, merusak integritas sistem, atau melanggar hak kekayaan intelektual orang lain. Kami berhak menangguhkan akun Anda jika ditemukan pelanggaran terhadap ketentuan ini.
                                </p>
                            </section>

                            <section>
                                <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 mb-4 font-headline">
                                    <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">5</span>
                                    Batasan Tanggung Jawab
                                </h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Layanan disediakan "apa adanya". Kami berusaha memberikan layanan terbaik, namun kami tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan kami.
                                </p>
                            </section>
                        </div>

                        <div className="mt-16 p-8 bg-slate-50 rounded-3xl border border-slate-100 italic text-slate-500 text-sm">
                            Jika Anda memiliki pertanyaan mengenai Syarat & Ketentuan ini, silakan hubungi tim dukungan kami melalui email di support@hasanaskari.com.
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
