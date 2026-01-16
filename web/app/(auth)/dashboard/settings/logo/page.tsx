'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from 'sonner';
import { Upload, Loader2, Building2 } from 'lucide-react';
import Image from 'next/image';

export default function LogoSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [logoUrl, setLogoUrl] = useState('');
    const [companyDetails, setCompanyDetails] = useState<any>({}); // Need other details for PUT request

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchCompany();
    }, []);

    async function fetchCompany() {
        try {
            const res = await fetch('/api/settings/company');
            if (res.ok) {
                const data = await res.json();
                if (data.company) {
                    // Use standard icon.png with cache buster if relative provided, 
                    // or just use what we have. 
                    // Wait, currently frontend uses /icon.png?v=... 
                    // But the DB might have specific url.
                    // Let's use the DB value for display, or if it's generic, add cache buster.
                    setLogoUrl(data.company.logo_url || '');
                    setCompanyDetails(data.company);
                }
            }
        } catch (error) {
            console.error('Failed to fetch company:', error);
            toast.error('Gagal mengambil data perusahaan');
        } finally {
            setLoading(false);
        }
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validasi ukuran (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Ukuran file maksimal 2MB');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. Upload File
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload gagal');

            const newLogoUrl = uploadData.url;

            // 2. Save to Company Settings
            // We need to send other company details too to avoid overwriting them with null?
            // The PUT API assumes complete object? No, we updated it to strictly update fields provided? 
            // My previous PUT implementation:
            // const { name, address, phone, email, website, logo_url } = body;
            // It destructured all. So if I send only logo_url, others become undefined?
            // "const result = stmt.run(..., logo_url, companyId);"
            // YES, it will overwrite with NULL if I don't send them.
            // So I must send everything. That's why I stored `companyDetails`.

            const updateBody = {
                ...companyDetails,
                logo_url: newLogoUrl
            };

            const saveRes = await fetch('/api/settings/company', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateBody)
            });

            if (!saveRes.ok) throw new Error('Gagal menyimpan logo baru');

            // Success
            setLogoUrl(newLogoUrl); // Or generic icon.png with timestamp
            setCompanyDetails(updateBody);

            toast.success('Logo berhasil diperbarui. Halaman akan dimuat ulang sebentar lagi...');

            // Reload to refresh sidebar and favicon
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Display Logic: if logoUrl is standard local one, append timestamp to force show new one
    // if it starts with /logos/, show it directly (preview)
    // Actually API converts /logos/ to /icon.png.
    // So let's just assume /icon.png?v=timestamp for display if it's set.

    // Better: just use /icon.png?v=now for live preview after save, 
    // but before save (during intermediate steps?) 
    // Wait, the flow is: Upload to /logos -> Save -> System copies to icon.png.
    // So visually we can show the /logos/ url immediately after upload if we wanted, 
    // but here we do it in one go.

    const displayLogo = logoUrl ? (logoUrl.includes('timestamp') ? logoUrl : `${logoUrl}?v=${Date.now()}`) : null;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Pengaturan Logo</h1>
                <p className="text-slate-500">Atur logo yang akan tampil di sidebar dan tab browser.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Logo Aplikasi</CardTitle>
                    <CardDescription>Upload logo perusahaan Anda (Format: PNG/JPG, Max: 2MB).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center justify-center gap-6 py-4">
                        <div className="relative h-40 w-40 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {logoUrl ? (
                                <div className="relative w-full h-full p-4">
                                    <Image
                                        src={displayLogo || '/icon.png'}
                                        alt="Company Logo"
                                        fill
                                        className="object-contain"
                                        unoptimized // Because query param might change
                                    />
                                </div>
                            ) : (
                                <Building2 className="h-12 w-12 text-slate-300" />
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                            />
                            <Button
                                disabled={uploading || !companyDetails.name}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Upload Logo Baru
                            </Button>
                            {!companyDetails.name && (
                                <p className="text-xs text-red-500 text-center">
                                    Data perusahaan belum dimuat.
                                </p>
                            )}
                            <p className="text-xs text-slate-500 max-w-xs text-center">
                                Disarankan menggunakan gambar dengan rasio 1:1 (persegi) dan latar belakang transparan.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
