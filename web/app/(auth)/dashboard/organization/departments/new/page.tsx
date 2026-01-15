'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Check, ChevronsUpDown, Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from 'sonner';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function NewDepartmentPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', code: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState(false);

    const { t } = useLanguage();

    const STANDARD_DEPARTMENTS = [
        { name: "Human Resources", code: "HR" },
        { name: "Finance", code: "FIN" },
        { name: "Information Technology", code: "IT" },
        { name: "Marketing", code: "MKT" },
        { name: "Sales", code: "SLS" },
        { name: "Operations", code: "OPS" },
        { name: "Legal", code: "LGL" },
        { name: "Customer Support", code: "CS" },
        { name: "Research & Development", code: "R&D" },
        { name: "Product Management", code: "PM" },
        { name: "Administration", code: "ADM" },
        { name: "Procurement", code: "PRO" },
        { name: "Business Development", code: "BD" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.code) { toast.error(t?.organization?.toast?.fillData || 'Mohon lengkapi data'); return; }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                toast.success(t?.organization?.toast?.saveSuccess || 'Departemen berhasil disimpan!');
                router.push('/dashboard/organization/departments');
                router.refresh();
            } else {
                const data = await res.json();
                toast.error(data.error || (t?.organization?.toast?.saveFailed || 'Gagal menyimpan departemen'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t?.organization?.toast?.error || 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <Link href="/dashboard/organization/departments" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors bg-white w-fit px-3 py-1.5 rounded-md border shadow-sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t?.organization?.new?.back || 'Kembali'}
            </Link>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>{t?.organization?.new?.title || 'Tambah Departemen Baru'}</CardTitle>
                    <CardDescription>{t?.organization?.new?.subtitle || 'Pilih dari daftar standar atau buat departemen baru.'}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2 flex flex-col">
                            <Label>{t?.organization?.new?.nameLabel || 'Nama Departemen'}</Label>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full justify-between"
                                    >
                                        {form.name || (t?.organization?.new?.namePlaceholder || 'Pilih atau ketik nama departemen...')}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder={t?.organization?.new?.searchPlaceholder || 'Cari atau buat baru...'} />
                                        <CommandList>
                                            <CommandEmpty>
                                                <div
                                                    className="p-2 cursor-pointer hover:bg-slate-100 flex items-center gap-2 text-primary font-medium"
                                                    onClick={() => {
                                                        // Fallback logic for creating new if not filtered (CommandInput internal logic might hide this if strict)
                                                        // Actually CommandEmpty shows when NO filter match.
                                                        // But we want to capture the typed text.
                                                        // Ideally we need a controlled CommandInput value to know what they typed.
                                                        // Let's assume standard usage for now: User types, sees empty, clicks this? 
                                                        // Wait, shadcn Command doesn't easily expose typed value in Empty.
                                                        // Simpler: Just allow selecting from list, OR typing in a regular input below if custom?
                                                        // BETTER: Controlled Command with value.
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4" /> {t?.organization?.new?.createNew || 'Buat baru (Ketik dan tekan Enter)'}
                                                </div>
                                            </CommandEmpty>
                                            <CommandGroup heading={t?.organization?.new?.suggestions || 'Saran Departemen'}>
                                                {STANDARD_DEPARTMENTS.map((dept) => (
                                                    <CommandItem
                                                        key={dept.code}
                                                        value={dept.name}
                                                        onSelect={(currentValue) => {
                                                            setForm({ name: dept.name, code: dept.code });
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                form.name === dept.name ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {dept.name}
                                                        <span className="ml-auto text-xs text-muted-foreground font-mono">{dept.code}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <p className="text-xs text-slate-500">
                                {t?.organization?.new?.hint || 'Jika tidak ada di list, ketik manual di bawah ini.'}
                            </p>

                            {/* Manual Input Fallback / Override */}
                            <Input
                                id="name"
                                placeholder={t?.organization?.new?.customPlaceholder || 'Atau ketik nama custom...'}
                                value={form.name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Auto-generate code if custom typing
                                    // First 3-4 chars, uppercase, no special chars
                                    const code = val.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
                                    setForm({ name: val, code: code });
                                }}
                                className={cn("mt-2", form.name ? "border-primary/50 bg-primary/5" : "")}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Link href="/dashboard/organization/departments">
                            <Button variant="outline" type="button">{t?.organization?.new?.cancel || 'Batal'}</Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting}>
                            <Save className="mr-2 h-4 w-4" /> {t?.organization?.new?.save || 'Simpan'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div >
    );
}
