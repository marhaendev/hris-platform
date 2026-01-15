'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User, Mail, Smartphone, Lock, Save, Loader2, CheckCircle2, XCircle, AlertCircle, Pencil, X, Briefcase, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from '@/lib/contexts/LanguageContext';

// Manual debounce used in useEffect

export default function ProfilePage() {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    // Username Validation State
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Phone Validation State
    const [phoneStatus, setPhoneStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
    const [phoneMessage, setPhoneMessage] = useState('');

    // Email Validation State
    const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
    const [emailMessage, setEmailMessage] = useState('');

    const [currentTab, setCurrentTab] = useState('basic');
    const [profileInfo, setProfileInfo] = useState<any>(null);

    // OTP State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    // Sync tab with URL query param
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'basic' || tab === 'password' || tab === 'job') {
            setCurrentTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/user/profile');
                if (res.ok) {
                    const data = await res.json();
                    setProfileInfo(data);
                    setFormData(prev => ({
                        ...prev,
                        name: data.name || '',
                        username: data.username || '',
                        email: data.email || '',
                        phone: data.phone || ''
                    }));
                } else {
                    const data = await res.json();
                    setMessage({ type: 'error', text: data.error || t.profile.errorFetch });
                }
            } catch (err) {
                setMessage({ type: 'error', text: t.common.error });
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [t.profile.errorFetch, t.common.error]);

    // Realtime Check Function
    const checkUsernameAvailability = async (uname: string) => {
        if (!uname || uname.length < 3) {
            setUsernameStatus('idle');
            setStatusMessage('');
            return;
        }

        setUsernameStatus('checking');
        setStatusMessage(t.common.loading);

        try {
            let url = `/api/user/check-username?username=${encodeURIComponent(uname)}`;
            if (profileInfo?.id) {
                url += `&excludeId=${profileInfo.id}`;
            }
            const res = await fetch(url);
            const data = await res.json();

            if (data.available) {
                setUsernameStatus('available');
                setStatusMessage(t.profile.personal.usernameAvailable);
            } else {
                setUsernameStatus('taken');
                setStatusMessage(data.message || t.profile.personal.usernameTaken);
            }
        } catch (error) {
            setUsernameStatus('error');
            setStatusMessage(t.profile.personal.usernameCheckError);
        }
    };

    // Debounce implementation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.username && formData.username.length >= 3) {
                checkUsernameAvailability(formData.username);
            } else {
                setUsernameStatus('idle');
                setStatusMessage('');
            }
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [formData.username]);


    // Realtime Check Function for Phone
    const checkPhoneAvailability = async (phoneVal: string) => {
        // Basic length check (Indonesia numbers usually > 9 digits)
        if (!phoneVal || phoneVal.length < 9) {
            setPhoneStatus('idle');
            setPhoneMessage('');
            return;
        }

        setPhoneStatus('checking');
        setPhoneMessage(t.common.loading);

        try {
            const res = await fetch(`/api/user/check-phone?phone=${encodeURIComponent(phoneVal)}`);
            const data = await res.json();

            if (data.available) {
                setPhoneStatus('available');
                setPhoneMessage(t.profile.personal.phoneAvailable);
            } else {
                setPhoneStatus('taken');
                setPhoneMessage(data.message || t.profile.personal.phoneTaken);
            }
        } catch (error) {
            setPhoneStatus('error');
            setPhoneMessage(t.profile.personal.phoneCheckError);
        }
    };

    // Debounce implementation for Phone
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.phone && formData.phone.length >= 9) {
                checkPhoneAvailability(formData.phone);
            } else {
                setPhoneStatus('idle');
                setPhoneMessage('');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.phone]);

    // Realtime Check Function for Email
    const checkEmailAvailability = async (emailVal: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal || !emailRegex.test(emailVal)) {
            setEmailStatus('idle');
            setEmailMessage('');
            return;
        }

        setEmailStatus('checking');
        setEmailMessage(t.common.loading);

        try {
            const res = await fetch(`/api/user/check-email?email=${encodeURIComponent(emailVal)}`);
            const data = await res.json();

            if (data.available) {
                setEmailStatus('available');
                setEmailMessage(t.profile.personal.emailAvailable);
            } else {
                setEmailStatus('taken');
                setEmailMessage(data.message || t.profile.personal.emailTaken);
            }
        } catch (error) {
            setEmailStatus('error');
            setEmailMessage(t.profile.personal.emailCheckError);
        }
    };

    // Debounce implementation for Email
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.email && formData.email.includes('@')) {
                checkEmailAvailability(formData.email);
            } else {
                setEmailStatus('idle');
                setEmailMessage('');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.email]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'username') {
            // Block spaces immediately
            if (/\s/.test(value)) return;
        }

        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            // Auto-sync username with email for COMPANY_OWNER
            if (name === 'email' && profileInfo?.role === 'COMPANY_OWNER') {
                newState.username = value;
            }
            return newState;
        });
    };

    const handleSubmit = async (e: React.FormEvent | null, otp?: string) => {
        if (e) e.preventDefault();
        setMessage(null);

        if (usernameStatus === 'taken' || phoneStatus === 'taken' || emailStatus === 'taken') {
            setMessage({ type: 'error', text: t.profile.validationError });
            return;
        }

        setIsSaving(true);
        if (otp) setIsSendingOtp(true); // Re-using this loading state or create new one? reuse isSaving is fine for the main button, strictly.

        try {
            const payload = { ...formData, otp };

            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: t.profile.success });
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                setIsEditing(false);
                setShowOtpModal(false);
                setOtpCode('');
                router.refresh();
            } else {
                if (res.status === 403 && data.requiresOtp) {
                    // OTP Required!
                    setShowOtpModal(true);
                    // Trigger OTP Send immediately
                    await requestOtp();
                } else {
                    setMessage({ type: 'error', text: data.error || t.common.error });
                }
            }
        } catch (err) {
            setMessage({ type: 'error', text: t.common.error });
        } finally {
            setIsSaving(false);
            setIsSendingOtp(false);
        }
    };

    const requestOtp = async () => {
        setIsSendingOtp(true);
        try {
            const res = await fetch('/api/user/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formData.phone })
            });
            const data = await res.json();
            if (res.ok) {
                // Toast success? Or just existing is fine.
            } else {
                setMessage({ type: 'error', text: data.error || t.common.error });
                setShowOtpModal(false); // Close if fail to send
            }
        } catch (err) {
            setMessage({ type: 'error', text: t.common.error });
            setShowOtpModal(false);
        } finally {
            setIsSendingOtp(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }


    // ... (keep useEffects)

    const toggleEdit = () => {
        if (isEditing) {
            // Cancel editing: revert data (optional, but for now just toggle off)
            setIsEditing(false);
            // Ideally we re-fetch or reset to initial, but for simplicity just toggle
        } else {
            setIsEditing(true);
        }
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t.profile.title}</h2>
                    <p className="text-slate-500">{t.profile.subtitle}</p>
                </div>
            </div>

            {message && (
                <Alert variant={message.type === 'success' ? 'default' : 'destructive'} className={`mb-4 ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : ''}`}>
                    {message.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                    <AlertTitle>{message.type === 'success' ? 'Berhasil' : 'Error'}</AlertTitle>
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}

            <Tabs value={currentTab} onValueChange={(val: any) => { setCurrentTab(val); setIsEditing(false); }} className="space-y-4">
                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger value="basic" className="flex items-center gap-2"><User className="h-4 w-4" /> {t.profile.tabs.account}</TabsTrigger>
                        <TabsTrigger value="job" className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> {t.profile.tabs.job}</TabsTrigger>
                        <TabsTrigger value="password" className="flex items-center gap-2"><Lock className="h-4 w-4" /> {t.profile.tabs.security}</TabsTrigger>
                    </TabsList>
                    {currentTab === 'basic' && (
                        !isEditing ? (
                            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                                <Pencil className="h-4 w-4" /> {t.profile.edit}
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                                    <X className="mr-2 h-4 w-4" /> {t.common.cancel}
                                </Button>
                                <Button
                                    type="submit"
                                    form="profile-form"
                                    disabled={isSaving || usernameStatus === 'taken' || phoneStatus === 'taken' || emailStatus === 'taken'}
                                    className="font-bold min-w-[120px]"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.common.loading}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> {t.common.save}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )
                    )}
                </div>

                <TabsContent value="basic">
                    <Card className="shadow-sm border-slate-200">
                        <form id="profile-form" onSubmit={handleSubmit}>
                            <CardHeader>
                                <CardTitle>{t.profile.personal.title}</CardTitle>
                                <CardDescription>
                                    {t.profile.personal.subtitle}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <fieldset disabled={!isEditing} className="grid gap-6 md:grid-cols-2 group">
                                    <div className="space-y-2">
                                        <Label htmlFor="username">{t.profile.personal.username}</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="username"
                                                name="username"
                                                placeholder={t.profile.personal.placeholder.username}
                                                className={`pl-9 bg-slate-50 border-slate-200 ${usernameStatus === 'available' ? 'border-emerald-500 focus-visible:ring-emerald-500' :
                                                    usernameStatus === 'taken' ? 'border-red-500 focus-visible:ring-red-500' : ''
                                                    } disabled:opacity-70 disabled:bg-slate-100`}
                                                disabled={!isEditing || profileInfo?.role === 'COMPANY_OWNER'}
                                                value={formData.username}
                                                onChange={handleChange}
                                                required
                                                minLength={3}
                                            />
                                            {/* Status Indicator Icon - Only show when editing */}
                                            {isEditing && (
                                                <div className="absolute right-3 top-2.5">
                                                    {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                                                    {usernameStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                                    {usernameStatus === 'taken' && <XCircle className="h-4 w-4 text-red-500" />}
                                                </div>
                                            )}
                                        </div>
                                        {/* Status Text */}
                                        {isEditing && (
                                            <div className="min-h-[20px]">
                                                {usernameStatus === 'available' && <p className="text-xs text-emerald-600 font-medium">{statusMessage}</p>}
                                                {usernameStatus === 'taken' && <p className="text-xs text-red-600 font-medium">{statusMessage}</p>}
                                                {usernameStatus === 'error' && <p className="text-xs text-red-500">{statusMessage}</p>}
                                                {usernameStatus === 'idle' && (
                                                    profileInfo?.role === 'COMPANY_OWNER'
                                                        ? <p className="text-[10px] text-amber-600 font-medium italic">Owner wajib menggunakan email untuk login.</p>
                                                        : <p className="text-[10px] text-slate-400">{t.profile.personal.usernameHint}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name">{t.profile.personal.fullName}</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder={t.profile.personal.placeholder.name}
                                                className="pl-9 bg-slate-50 border-slate-200 disabled:opacity-70 disabled:bg-slate-100"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t.profile.personal.email}</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder={t.profile.personal.placeholder.email}
                                                className={`pl-9 bg-slate-50 border-slate-200 ${emailStatus === 'available' ? 'border-emerald-500 focus-visible:ring-emerald-500' :
                                                    emailStatus === 'taken' ? 'border-red-500 focus-visible:ring-red-500' : ''
                                                    } disabled:opacity-70 disabled:bg-slate-100`}
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                            {/* Status Indicator Icon - Only show when editing */}
                                            {isEditing && (
                                                <div className="absolute right-3 top-2.5">
                                                    {emailStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                                                    {emailStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                                    {emailStatus === 'taken' && <XCircle className="h-4 w-4 text-red-500" />}
                                                </div>
                                            )}
                                        </div>
                                        {/* Status Text for Email */}
                                        {isEditing && (
                                            <div className="min-h-[20px]">
                                                {emailStatus === 'available' && <p className="text-xs text-emerald-600 font-medium">{emailMessage}</p>}
                                                {emailStatus === 'taken' && <p className="text-xs text-red-600 font-medium">{emailMessage}</p>}
                                                {emailStatus === 'error' && <p className="text-xs text-red-500">{emailMessage}</p>}
                                                {emailStatus === 'idle' && <p className="text-[10px] text-slate-400">{t.profile.personal.emailHint}</p>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">{t.profile.personal.phone} <span className="text-slate-400 font-normal">(Opsional)</span></Label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="phone"
                                                name="phone"
                                                placeholder={t.profile.personal.placeholder.phone}
                                                className={`pl-9 bg-slate-50 border-slate-200 ${phoneStatus === 'available' ? 'border-emerald-500 focus-visible:ring-emerald-500' :
                                                    phoneStatus === 'taken' ? 'border-red-500 focus-visible:ring-red-500' : ''
                                                    } disabled:opacity-70 disabled:bg-slate-100`}
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                            {/* Status Indicator Icon - Only show when editing */}
                                            {isEditing && (
                                                <div className="absolute right-3 top-2.5">
                                                    {phoneStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                                                    {phoneStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                                    {phoneStatus === 'taken' && <XCircle className="h-4 w-4 text-red-500" />}
                                                </div>
                                            )}
                                        </div>
                                        {/* Status Text for Phone */}
                                        {isEditing && (
                                            <div className="min-h-[20px]">
                                                {phoneStatus === 'available' && <p className="text-xs text-emerald-600 font-medium">{phoneMessage}</p>}
                                                {phoneStatus === 'taken' && <p className="text-xs text-red-600 font-medium">{phoneMessage}</p>}
                                                {phoneStatus === 'error' && <p className="text-xs text-red-500">{phoneMessage}</p>}
                                                {phoneStatus === 'idle' && <p className="text-[10px] text-slate-400">{t.profile.personal.phoneHint}</p>}
                                            </div>
                                        )}
                                    </div>
                                </fieldset>
                            </CardContent>
                        </form>
                    </Card>
                </TabsContent>

                <TabsContent value="job">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>{t.profile.job.title}</CardTitle>
                            <CardDescription>{t.profile.job.subtitle}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t.profile.job.position}</Label>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <Briefcase className="h-5 w-5 text-primary" />
                                        </div>
                                        <p className="text-lg font-bold text-slate-900">{profileInfo?.positionTitle || '-'}</p>
                                    </div>
                                </div>
                                <div className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t.profile.job.department}</Label>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <p className="text-lg font-bold text-slate-900">{profileInfo?.departmentName || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        {t.profile.job.quotaTitle}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{t.profile.job.annualBalance}</p>
                                        <p className="text-2xl font-black text-blue-900 mt-1">{profileInfo?.annualLeaveQuota || 0} <span className="text-xs font-normal text-blue-400">{t.profile.job.days}</span></p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/30">
                                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{t.profile.job.usedLeave}</p>
                                        <p className="text-2xl font-black text-orange-900 mt-1">{profileInfo?.usedLeaveQuota || 0} <span className="text-xs font-normal text-orange-400">{t.profile.job.days}</span></p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-green-100 bg-green-50/30 font-bold">
                                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{t.profile.job.remaining}</p>
                                        <p className="text-2xl font-black text-green-900 mt-1">{profileInfo?.remainingLeaveQuota || 0} <span className="text-xs font-normal text-green-400">{t.profile.job.days}</span></p>
                                    </div>
                                </div>

                                {profileInfo?.annualLeaveQuota > 0 && (
                                    <div className="space-y-2 mt-4">
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-1000"
                                                style={{ width: `${Math.min(100, (profileInfo.usedLeaveQuota / profileInfo.annualLeaveQuota) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            <span>{Math.round((profileInfo.usedLeaveQuota / profileInfo.annualLeaveQuota) * 100)}% {t.profile.job.usedLeave}</span>
                                            <span>{Math.round((profileInfo.remainingLeaveQuota / profileInfo.annualLeaveQuota) * 100)}% {t.profile.job.remaining}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="password">
                    <Card className="shadow-sm border-slate-200">
                        <form onSubmit={handleSubmit}>
                            <CardHeader>
                                <CardTitle>{t.profile.security.title}</CardTitle>
                                <CardDescription>
                                    {t.profile.security.subtitle}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">{t.profile.security.newPassword}</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                placeholder="******"
                                                className="pl-9 bg-slate-50 border-slate-200"
                                                value={formData.password}
                                                onChange={handleChange}
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">{t.profile.security.confirmPassword}</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                placeholder="******"
                                                className="pl-9 bg-slate-50 border-slate-200"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end">
                                <Button type="submit" disabled={isSaving} className="font-bold min-w-[120px]">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.common.loading}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> {t.profile.security.update}
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.profile.otp.title}</DialogTitle>
                        <DialogDescription>
                            {t.profile.otp.desc} <strong>{formData.phone}</strong>.
                            Masukkan kode tersebut untuk menyimpan perubahan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>{t.profile.otp.inputLabel}</Label>
                            <Input
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="123456"
                                className="text-center text-lg tracking-widest"
                                maxLength={6}
                            />
                        </div>
                        <div className="flex justify-center">
                            <Button
                                variant="link"
                                size="sm"
                                disabled={isSendingOtp}
                                onClick={requestOtp}
                            >
                                {isSendingOtp ? t.profile.otp.verifying : t.profile.otp.resend}
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowOtpModal(false)}>{t.common.cancel}</Button>
                        <Button
                            onClick={() => handleSubmit(null, otpCode)}
                            disabled={otpCode.length < 6 || isSaving}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {t.profile.otp.verify}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
