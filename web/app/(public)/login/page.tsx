'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, KeyRound, Mail, Zap, CheckCircle2, ShieldCheck, Star, Smartphone, MessageSquare, User, Trash2, ChevronDown, AlertTriangle } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicNavbar } from "@/components/public-navbar";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface SavedAccount {
    username: string;
    password?: string;
    name?: string;
    savedAt: number;
}

const SAVED_ACCOUNTS_KEY = 'hris_saved_accounts';

export default function LoginPage() {
    const [loginMethod, setLoginMethod] = useState<'username' | 'phone'>('username');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // OTP State
    const [phone, setPhone] = useState('');
    const [otpState, setOtpState] = useState<'idle' | 'sent'>('idle');
    const [otpCode, setOtpCode] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Resend Timer
    const [resendCountdown, setResendCountdown] = useState(0);

    // Saved Accounts State
    const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
    const [rememberMe, setRememberMe] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Load saved accounts from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(SAVED_ACCOUNTS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as SavedAccount[];
                setSavedAccounts(parsed);
                // Auto-fill last used account
                if (parsed.length > 0) {
                    setUsername(parsed[0].username);
                }
            }
        } catch (e) {
            console.error('Failed to load saved accounts', e);
        }
    }, []);

    // Save account to localStorage
    const saveAccount = (usernameToSave: string, passwordToSave?: string, nameToSave?: string) => {
        try {
            const existing = savedAccounts.filter(acc => acc.username !== usernameToSave);
            const newAccount: SavedAccount = {
                username: usernameToSave,
                password: passwordToSave,
                name: nameToSave,
                savedAt: Date.now()
            };
            const updated = [newAccount, ...existing].slice(0, 5); // Max 5 accounts
            localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
            setSavedAccounts(updated);
        } catch (e) {
            console.error('Failed to save account', e);
        }
    };

    // Remove saved account
    const removeAccount = (usernameToRemove: string) => {
        const updated = savedAccounts.filter(acc => acc.username !== usernameToRemove);
        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
        setSavedAccounts(updated);
    };

    // Select saved account
    const selectAccount = (account: SavedAccount) => {
        setUsername(account.username);
        setPassword(account.password || ''); // Auto-fill the password if it exists
        // Focus the password field after a short delay to nudge browser's UI
        setTimeout(() => {
            const passwordInput = document.getElementById('password') as HTMLInputElement;
            if (passwordInput) passwordInput.focus();
        }, 50);
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendCountdown > 0) {
            timer = setInterval(() => {
                setResendCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendCountdown]);

    const handleResend = async () => {
        setResendCountdown(300); // 5 Minutes
        setOtpCode('');

        try {
            const res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                body: JSON.stringify({ phone }),
            });

            if (res.ok) {
                // Success feedback if needed
            }
        } catch (e) { /* ignore */ }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (loginMethod === 'username') {
                // Username Login
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ username, password }),
                });
                const result = await res.json();
                if (!res.ok) {
                    setError(result.error || 'Terjadi kesalahan saat login');
                } else {
                    // Save account if remember me is checked
                    if (rememberMe) {
                        saveAccount(username, password, result.user?.name);
                    }
                    window.location.href = '/dashboard';
                }
            } else {
                // Phone OTP Login
                if (otpState === 'idle') {
                    // Send OTP
                    const res = await fetch('/api/auth/otp/send', {
                        method: 'POST',
                        body: JSON.stringify({ phone }),
                    });
                    const result = await res.json();
                    if (!res.ok) {
                        setError(result.error || 'Gagal mengirim OTP');
                    } else {
                        setOtpState('sent');
                        setResendCountdown(300);
                    }
                } else {
                    // Verify OTP
                    const res = await fetch('/api/auth/otp/verify', {
                        method: 'POST',
                        body: JSON.stringify({ phone, code: otpCode }),
                    });
                    const result = await res.json();
                    if (!res.ok) {
                        setError(result.error || 'Gagal verifikasi OTP');
                    } else {
                        router.push('/dashboard');
                        router.refresh();
                    }
                }
            }
        } catch (err) {
            setError('Gagal menghubungi server');
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
            <div className="relative flex w-full flex-col items-center justify-center p-4 md:p-8 lg:px-12 lg:pt-4 lg:pb-40 lg:h-full lg:overflow-hidden overflow-y-auto">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none sticky top-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]"></div>
                </div>

                <div className="relative z-10 flex w-full max-w-md flex-col animate-fade-in lg:min-h-[520px]">
                    <div className="mb-2">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 font-bold gap-2 p-0 h-auto hover:bg-transparent transition-colors text-xs uppercase tracking-wider">
                                <ArrowLeft className="h-3.5 w-3.5" /> Kembali
                            </Button>
                        </Link>
                    </div>

                    <div className="mb-4 text-center lg:text-left">
                        <h1 className="text-2xl lg:text-3xl font-black mb-1 tracking-tight font-headline bg-gradient-to-r from-primary to-cyan-600 bg-clip-text text-transparent">
                            Selamat Datang Kembali
                        </h1>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">
                            Masuk menggunakan akun <b>Username</b> atau WhatsApp Anda.
                        </p>
                    </div>

                    {/* Login Method Toggle: Dropdown (Mobile) vs Tabs (Desktop) */}
                    <div className="mb-4">
                        {/* Mobile Dropdown */}
                        <div className="block lg:hidden">
                            <Select
                                value={loginMethod}
                                onValueChange={(val: 'username' | 'phone') => { setLoginMethod(val); setError(''); }}>
                                <SelectTrigger className="w-full h-12 bg-slate-100 border-none font-bold text-slate-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="username">
                                        <span className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Masuk via Username</span>
                                    </SelectItem>
                                    <SelectItem value="phone">
                                        <span className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Masuk via WhatsApp</span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Desktop Tabs */}
                        <div className="hidden lg:grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                            <button
                                onClick={() => { setLoginMethod('username'); setError(''); }}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${loginMethod === 'username'
                                    ? 'bg-white shadow text-slate-800'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <KeyRound className="h-4 w-4" /> Username
                            </button>
                            <button
                                onClick={() => { setLoginMethod('phone'); setError(''); }}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${loginMethod === 'phone'
                                    ? 'bg-white shadow text-slate-800'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Smartphone className="h-4 w-4" /> Masuk via WhatsApp
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {loginMethod === 'username' ? (
                            <>
                                <div className="space-y-1.5">
                                    <Label htmlFor="username" className="text-slate-700 font-bold text-xs ml-1 select-none flex items-center gap-2">
                                        <KeyRound className="h-3.5 w-3.5 text-slate-400" /> Username
                                    </Label>
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        placeholder="Masukkan username Anda"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10 transition-all duration-300 rounded-xl pl-4 text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <Label htmlFor="password" className="text-slate-700 font-bold text-xs select-none flex items-center gap-2">
                                            <KeyRound className="h-3.5 w-3.5 text-slate-400" /> Password
                                        </Label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                                        >
                                            Lupa password?
                                        </Link>
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10 transition-all duration-300 rounded-xl pl-4 text-sm"
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        checked={rememberMe}
                                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="text-sm text-slate-600 font-medium cursor-pointer select-none"
                                    >
                                        Ingat akun saya
                                    </Label>
                                </div>

                                {/* Saved Accounts Section - Dropdown */}
                                {savedAccounts.length > 0 && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <Label className="text-slate-500 font-bold text-xs ml-1 mb-2 block flex items-center gap-2">
                                            <User className="h-3.5 w-3.5" /> Akun Tersimpan
                                        </Label>
                                        <Select
                                            value=""
                                            onValueChange={(val) => {
                                                const acc = savedAccounts.find(a => a.username === val);
                                                if (acc) selectAccount(acc);
                                            }}
                                        >
                                            <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl">
                                                <SelectValue placeholder="Pilih akun tersimpan..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {savedAccounts.map((acc) => (
                                                    <SelectItem key={acc.username} value={acc.username}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                <User className="h-3 w-3" />
                                                            </div>
                                                            <span className="font-medium">{acc.name || acc.username}</span>
                                                            {acc.name && <span className="text-xs text-slate-400 font-mono">@{acc.username}</span>}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="mt-2 text-xs text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            Hapus semua akun tersimpan
                                        </button>
                                    </div>
                                )}

                                {/* Delete Confirmation Modal */}
                                <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                                                <AlertTriangle className="h-6 w-6 text-red-600" />
                                            </div>
                                            <DialogTitle className="text-center">Hapus Semua Akun Tersimpan?</DialogTitle>
                                            <DialogDescription className="text-center">
                                                Semua akun yang tersimpan di perangkat ini akan dihapus. Anda perlu login ulang untuk menyimpan akun.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className="flex gap-2 sm:justify-center">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1"
                                            >
                                                Batal
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() => {
                                                    localStorage.removeItem('hris_saved_accounts');
                                                    setSavedAccounts([]);
                                                    setShowDeleteConfirm(false);
                                                }}
                                                className="flex-1"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Ya, Hapus
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </>
                        ) : (
                            /* Phone / OTP Flow */
                            <>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-slate-700 font-bold text-xs ml-1 select-none flex items-center gap-2">
                                        <Smartphone className="h-3.5 w-3.5 text-slate-400" /> Nomor Handphone
                                    </Label>
                                    <div className="relative group">
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="081234567890"
                                            required
                                            disabled={otpState === 'sent'}
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Numeric only
                                            className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10 transition-all duration-300 rounded-xl pl-4 text-sm font-mono tracking-wide"
                                        />
                                        {otpState === 'sent' && (
                                            <button
                                                type="button"
                                                onClick={() => { setOtpState('idle'); setOtpCode(''); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary hover:underline"
                                            >
                                                Ubah
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {otpState === 'sent' && (
                                    <div className="space-y-3 animate-fade-in-up">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="otp" className="text-slate-700 font-bold text-xs ml-1 select-none flex items-center gap-2">
                                                <MessageSquare className="h-3.5 w-3.5 text-slate-400" /> Kode OTP
                                            </Label>
                                            <Input
                                                id="otp"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="______"
                                                required
                                                maxLength={6}
                                                value={otpCode}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setOtpCode(val);
                                                }}
                                                className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10 transition-all duration-300 rounded-xl pl-4 text-sm font-mono tracking-[0.5em] text-center font-bold text-lg"
                                            />
                                        </div>

                                        <div className="flex flex-col items-start gap-1 px-1 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
                                            <p className="text-[10px] text-slate-400">
                                                Kode dikirim ke WhatsApp Anda.
                                            </p>
                                            {resendCountdown > 0 ? (
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    Kirim ulang dalam {Math.floor(resendCountdown / 60)}:{(resendCountdown % 60).toString().padStart(2, '0')}
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleResend}
                                                    className="text-[10px] font-bold text-primary hover:underline hover:text-primary/80 transition-colors"
                                                >
                                                    Kirim Ulang Kode
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

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
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-base shadow-xl shadow-primary/20 rounded-xl transition-all duration-300 group active:scale-[0.98] mt-2"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Memproses...</span>
                                </div>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    {loginMethod === 'username'
                                        ? 'Masuk Ke HRIS'
                                        : otpState === 'idle' ? 'Kirim Kode OTP' : 'Verifikasi & Masuk'
                                    }
                                    <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Registration section removed as per user request */}




                </div>
            </div>

            {/* Right Side: Visual Content */}
            <div className="hidden lg:flex relative bg-slate-900 items-center justify-center overflow-hidden h-full">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-cyan-500/20 z-0"></div>

                {/* Animated Circles */}
                <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-cyan-500/10 blur-[80px] animate-pulse delay-700"></div>

                <div className="relative z-10 p-8 max-w-xl overflow-visible">
                    <div className="space-y-8 relative">
                        <div className="space-y-6">

                            <h2 className="text-4xl font-black text-white leading-[1.1] tracking-tight font-headline">
                                Kelola SDM <br />
                                <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">Tanpa Ribet.</span>
                            </h2>
                            <p className="text-slate-400 text-xl font-medium leading-relaxed">
                                Kelola data karyawan, absensi, cuti, dan payroll dalam satu sistem terintegrasi.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {[
                                { icon: CheckCircle2, text: "Manajemen Karyawan & Organisasi" },
                                { icon: CheckCircle2, text: "Absensi Geotagging & Face Recognition" },
                                { icon: CheckCircle2, text: "Payroll Otomatis & Slip Gaji Digital" },
                                { icon: CheckCircle2, text: "Manajemen Cuti & Izin Online" },
                                { icon: CheckCircle2, text: "Dashboard Analitik Real-time" },
                                { icon: CheckCircle2, text: "Integrasi WhatsApp Gateway & OTP" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 text-slate-300">
                                    <div className="h-6 w-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold text-lg">{item.text}</span>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>



            </div>
        </div >
    );
}
