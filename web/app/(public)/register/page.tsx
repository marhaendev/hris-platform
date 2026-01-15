'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Mail, Lock, ShieldCheck, Rocket, Sparkles, CheckCircle2, Star, Smartphone, Building2 } from "lucide-react";

import { PublicNavbar } from "@/components/public-navbar";

export default function RegisterPage() {
    const router = useRouter();

    // Disable registration as per user request
    useEffect(() => {
        router.push('/login');
    }, [router]);

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const data = Object.fromEntries(formData);

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || 'Gagal mendaftarkan akun');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-2 bg-white lg:h-screen lg:overflow-hidden relative">
            <div className="lg:hidden">
                <PublicNavbar />
            </div>
            {/* Left Side: Form */}
            <div className="relative flex w-full flex-col items-center justify-center p-6 md:p-8 lg:p-12 lg:h-full lg:overflow-hidden overflow-y-auto pt-24 lg:pt-0">
                {/* Background Decoration */}
                <div className="absolute bottom-0 right-0 w-full h-full opacity-[0.03] pointer-events-none">
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500 blur-[120px]"></div>
                </div>

                <div className="relative z-10 flex w-full max-w-md flex-col justify-center py-10 lg:h-full lg:max-h-[850px] lg:py-0 animate-fade-in">
                    {/* Brand Logo - Only Visible on Desktop */}
                    <div className="hidden lg:flex mb-6 justify-center lg:justify-start">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="h-8 w-28 relative group-hover:scale-105 transition-transform">
                                <Image
                                    src="/logo.png"
                                    alt="HRIS Logo"
                                    fill
                                    className="object-contain object-left"
                                    priority
                                />
                            </div>
                        </Link>
                    </div>

                    <div className="mb-6 text-center lg:text-left">
                        <h1 className="text-3xl font-black mb-2 tracking-tight font-headline bg-gradient-to-r from-primary to-cyan-600 bg-clip-text text-transparent">
                            Mulai Perjalanan Anda
                        </h1>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">
                            Gratis untuk 5 karyawan pertama. Tidak butuh kartu kredit.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-slate-700 font-bold text-xs ml-1 flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-slate-400" /> Nama Lengkap
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Budi Santoso"
                                required
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10 transition-all duration-300 rounded-xl pl-4 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="companyName" className="text-slate-700 font-bold text-xs ml-1 flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5 text-slate-400" /> Nama Perusahaan
                            </Label>
                            <Input
                                id="companyName"
                                name="companyName"
                                type="text"
                                placeholder="PT. Maju Sejahtera"
                                required
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10 transition-all duration-300 rounded-xl pl-4 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-slate-700 font-bold text-xs ml-1 flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-slate-400" /> Alamat Email Kerja
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="budi@perusahaan.com"
                                required
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10 transition-all duration-300 rounded-xl pl-4 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-slate-700 font-bold text-xs ml-1 flex items-center gap-2">
                                <Smartphone className="h-3.5 w-3.5 text-slate-400" /> Nomor Handphone <span className="text-slate-400 font-normal">(Opsional)</span>
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="081234567890"
                                pattern="[0-9]*"
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10 transition-all duration-300 rounded-xl pl-4 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-slate-700 font-bold text-xs ml-1 flex items-center gap-2">
                                <Lock className="h-3.5 w-3.5 text-slate-400" /> Kata Sandi
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Minimal 8 karakter"
                                required
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10 transition-all duration-300 rounded-xl pl-4 text-sm"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-shake">
                                <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 flex-shrink-0">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                </div>
                                <p className="text-red-700 text-xs font-bold">{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-base shadow-xl shadow-primary/20 rounded-xl transition-all duration-300 group mt-2 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Membuat Akun...</span>
                                </div>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Daftar Sekarang <Rocket className="h-4 w-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center lg:text-left">
                        <p className="text-slate-500 font-medium text-sm">
                            Sudah punya akun?{" "}
                            <Link href="/login" className="text-primary font-black hover:underline underline-offset-4 decoration-2">
                                Masuk ke Dashboard
                            </Link>
                        </p>
                    </div>

                    <p className="mt-4 text-xs text-slate-400 text-center lg:text-left leading-relaxed">
                        Dengan mendaftar, Anda menyetujui <Link href="/terms" className="underline">Syarat & Ketentuan</Link> serta <Link href="/privacy" className="underline">Kebijakan Privasi</Link> HRIS.
                    </p>
                </div>
            </div>

            {/* Right Side: Visual Content */}
            <div className="hidden lg:flex relative bg-slate-900 items-center justify-center overflow-hidden h-full">
                <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:30px_30px] opacity-30"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/90 to-primary/20 z-0"></div>

                <div className="relative z-10 p-8 max-w-xl">
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary font-bold text-sm">
                                <Sparkles className="h-4 w-4" /> Solusi HR Masa Depan
                            </div>
                            <h2 className="text-4xl font-black text-white leading-[1.1] tracking-tight font-headline">
                                Siap Membuat <br />
                                <span className="bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent">Tim Anda Hebat?</span>
                            </h2>
                            <p className="text-slate-400 text-xl font-medium leading-relaxed">
                                Bergabunglah dengan 500+ bisnis yang sudah beralih ke cara kerja yang lebih modern dan efisien.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {[
                                { title: "Implementasi Cepat", desc: "Hanya butuh 5 menit untuk setup awal." },
                                { title: "Data Aman & Terpusat", desc: "Enkripsi tingkat tinggi untuk data penting karyawan." },
                                { title: "Dukungan Lokal", desc: "Tim kami siap membantu Anda di setiap langkah." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-300">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-lg">{item.title}</h3>
                                        <p className="text-slate-500 font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-800" />
                                    ))}
                                </div>
                                <div>
                                    <div className="flex text-yellow-500">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 fill-current" />)}
                                    </div>
                                    <p className="text-slate-500 text-sm font-bold mt-0.5">Dipercaya 5,000+ HR Indonesia</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
