'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft, KeyRound, Smartphone, MessageSquare,
    ShieldCheck, CheckCircle2, Zap, AlertCircle, Eye, EyeOff
} from "lucide-react";
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [phone, setPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCountdown, setResendCountdown] = useState(0);
    const router = useRouter();

    // Timer logic for OTP resend
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendCountdown > 0) {
            timer = setInterval(() => {
                setResendCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendCountdown]);

    // Stage 1: Send OTP
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success('Kode OTP telah dikirim ke WhatsApp Anda');
                setStep(2);
                setResendCountdown(300); // 5 minutes
            } else {
                setError(data.error || 'Gagal mengirim OTP');
            }
        } catch (err) {
            setError('Gagal menghubungi server');
        } finally {
            setIsLoading(false);
        }
    };

    // Stage 2: Verify OTP
    // Note: We don't call a separate verify API here because we'll verify it in the final step 
    // to ensure security. But for UX, we can just move to step 3.
    const handleNextToReset = (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length !== 6) {
            setError('Masukkan 6 digit kode OTP');
            return;
        }
        setError('');
        setStep(3);
    };

    // Stage 3: Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Konfirmasi password tidak cocok');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otpCode, newPassword }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success('Password berhasil diperbarui! Silakan login kembali.');
                setTimeout(() => router.push('/login'), 2000);
            } else {
                setError(data.error || 'Gagal mereset password');
                // If OTP is wrong, maybe go back to step 2
                if (data.error?.includes('OTP')) setStep(2);
            }
        } catch (err) {
            setError('Gagal menghubungi server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500 blur-[120px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="flex mb-8 justify-center">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="h-10 w-32 relative">
                            <Image
                                src="/logo.png"
                                alt="HRIS Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </Link>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl shadow-slate-200/50">
                    <div className="mb-8 text-center">
                        <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 group ring-4 ring-primary/5 transition-all">
                            {step === 1 && <Smartphone className="h-7 w-7" />}
                            {step === 2 && <MessageSquare className="h-7 w-7" />}
                            {step === 3 && <ShieldCheck className="h-7 w-7" />}
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 font-headline mb-2">
                            {step === 1 && "Lupa Password?"}
                            {step === 2 && "Verifikasi OTP"}
                            {step === 3 && "Reset Password"}
                        </h1>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                            {step === 1 && "Masukkan nomor WhatsApp yang terdaftar untuk menerima kode verifikasi."}
                            {step === 2 && `Masukkan 6 digit kode yang kami kirim ke nomor WhatsApp ${phone}.`}
                            {step === 3 && "Buat password baru yang kuat untuk akun Anda."}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                            <p className="text-red-700 text-xs font-bold leading-tight">{error}</p>
                        </div>
                    )}

                    {/* Form Step 1: Input Phone */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-slate-700 font-bold text-xs ml-1 flex items-center gap-2">
                                    <Smartphone className="h-3.5 w-3.5 text-slate-400" /> Nomor WhatsApp
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="Contoh: 08123456789"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10 transition-all rounded-xl px-4 font-mono tracking-wider"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading || phone.length < 10}
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-base shadow-lg shadow-primary/20 rounded-xl transition-all group"
                            >
                                {isLoading ? "Mengirim..." : (
                                    <span className="flex items-center gap-2">
                                        Kirim Kode OTP <Zap className="h-4 w-4 fill-current" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Form Step 2: Input OTP */}
                    {step === 2 && (
                        <form onSubmit={handleNextToReset} className="space-y-5">
                            <div className="space-y-2 text-center">
                                <Label htmlFor="otp" className="text-slate-700 font-bold text-xs flex items-center justify-center gap-2">
                                    <MessageSquare className="h-3.5 w-3.5 text-slate-400" /> Kode Verifikasi
                                </Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="______"
                                    required
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    className="h-14 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10 transition-all rounded-xl text-center text-2xl font-black tracking-[0.5em] font-mono"
                                />
                                <div className="mt-3">
                                    {resendCountdown > 0 ? (
                                        <p className="text-[10px] text-slate-400 font-bold">
                                            Kirim ulang dalam {Math.floor(resendCountdown / 60)}:{(resendCountdown % 60).toString().padStart(2, '0')}
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleSendOTP}
                                            className="text-[10px] font-bold text-primary hover:underline"
                                        >
                                            Kirim Ulang OTP
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button
                                    type="submit"
                                    disabled={otpCode.length !== 6}
                                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-base shadow-lg shadow-primary/20 rounded-xl transition-all"
                                >
                                    Lanjut Reset Password
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep(1)}
                                    className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                                >
                                    Ganti Nomor WhatsApp
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Form Step 3: Password Baru */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-slate-700 font-bold text-xs ml-1 flex items-center gap-2">
                                    <KeyRound className="h-3.5 w-3.5 text-slate-400" /> Password Baru
                                </Label>
                                <div className="relative group">
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min 6 karakter"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10 transition-all rounded-xl px-4 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-slate-700 font-bold text-xs ml-1 flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" /> Konfirmasi Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Ulangi password baru"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary/10 transition-all rounded-xl px-4"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-base shadow-lg shadow-primary/20 rounded-xl transition-all mt-2"
                            >
                                {isLoading ? "Memperbarui..." : "Simpan Password Baru"}
                            </Button>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm">
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
