'use client';

import { useState, useEffect } from 'react';
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
import { generateRolesForDept } from "@/lib/data/roleTemplates";
import { toast } from 'sonner';
import { useLanguage } from '@/lib/contexts/LanguageContext';

export default function NewPositionPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [form, setForm] = useState({ title: '', level: 'Staff' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deptName, setDeptName] = useState("");
    const [suggestions, setSuggestions] = useState<Array<{ title: string, level: string }>>([]);
    const [open, setOpen] = useState(false);

    const { t } = useLanguage();

    useEffect(() => {
        // Fetch Dept Name to generate suggestions
        fetch(`/api/departments?id=${params.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.name) {
                    setDeptName(data.name);
                    // Fetch suggestions from Master Positions (Core)
                    // We can filter by category if needed, for now just fetch all or search based on Dept Name?
                    // Ideally we search based on dept name keywords, but dept names vary.
                    // Let's fetch all "Staff" and "Manager" roles or use search input?
                    // Better: Fetch relevant roles based on Department Name mapping if possible, 
                    // OR just let the user search in the Combobox (server-side search).

                    // For now, let's load initial suggestions that match Department Name (e.g. "HR" -> "Human Resources")
                    fetch(`/api/master-positions?category=${encodeURIComponent(data.name)}`)
                        .then(r => r.json())
                        .then(roles => {
                            if (roles.length > 0) {
                                setSuggestions(roles);
                            } else {
                                // Fallback: load generic ones
                                fetch(`/api/master-positions?q=${encodeURIComponent(data.name)}`)
                                    .then(r2 => r2.json())
                                    .then(roles2 => {
                                        if (roles2.length > 0) setSuggestions(roles2);
                                        else {
                                            // Fallback to ALL if no specific match, so user sees something
                                            fetch('/api/master-positions')
                                                .then(r3 => r3.json())
                                                .then(setSuggestions);
                                        }
                                    });
                            }
                        });
                }
            })
            .catch(console.error);
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title) { toast.error(t?.organization?.position?.new?.toast?.fillTitle || 'Mohon isi nama jabatan'); return; }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/positions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, departmentId: params.id })
            });

            if (res.ok) {
                toast.success(t?.organization?.position?.new?.toast?.saveSuccess || 'Posisi berhasil disimpan!');
                router.push('/dashboard/organization/departments');
                router.refresh();
            } else {
                toast.error(t?.organization?.position?.new?.toast?.saveFailed || 'Gagal menyimpan posisi');
            }
        } catch (error) {
            console.error(error);
            toast.error(t?.organization?.position?.new?.toast?.error || 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <Link href="/dashboard/organization/departments" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors bg-white w-fit px-3 py-1.5 rounded-md border shadow-sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t?.organization?.position?.new?.back || 'Kembali'}
            </Link>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>{t?.organization?.position?.new?.title || 'Tambah Posisi Baru'} - {deptName}</CardTitle>
                    <CardDescription>{t?.organization?.position?.new?.subtitle || 'Pilih posisi standar atau buat custom untuk departemen'} {deptName}.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2 flex flex-col">
                            <Label>{t?.organization?.position?.new?.nameLabel || 'Nama Posisi'}</Label>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full justify-between"
                                    >
                                        {form.title || (t?.organization?.position?.new?.namePlaceholder || 'Pilih posisi...')}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder={t?.organization?.position?.new?.searchPlaceholder || 'Cari posisi di database core...'}
                                            onValueChange={(val) => {
                                                // Real-time search
                                                fetch(`/api/master-positions?q=${encodeURIComponent(val)}`)
                                                    .then(r => r.json())
                                                    .then(setSuggestions);
                                            }}
                                        />
                                        <CommandList>
                                            <CommandEmpty>
                                                <div className="p-2 text-sm text-slate-500">{t?.organization?.position?.new?.notFound || 'Posisi tidak ditemukan di database core using query.'}</div>
                                            </CommandEmpty>
                                            <CommandGroup heading={t?.organization?.position?.new?.suggestions || 'Saran dari Core Database'}>
                                                {suggestions.map((role) => (
                                                    <CommandItem
                                                        key={role.title}
                                                        value={role.title}
                                                        onSelect={(currentValue) => {
                                                            setForm({ ...form, title: role.title, level: role.level });
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                form.title === role.title ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {role.title}
                                                        <span className="ml-auto text-xs text-muted-foreground font-mono">{role.level}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            <Input
                                id="title"
                                placeholder={t?.organization?.position?.new?.customPlaceholder || 'Atau ketik nama jabatan custom...'}
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className={cn("mt-2", form.title ? "border-primary/50 bg-primary/5" : "")}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="level">{t?.organization?.position?.new?.levelLabel || 'Level'}</Label>
                            <select
                                id="level"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={form.level}
                                onChange={(e) => setForm({ ...form, level: e.target.value })}
                            >
                                <option value="Intern">Intern</option>
                                <option value="Staff">Staff</option>
                                <option value="Senior Staff">Senior Staff</option>
                                <option value="Supervisor">Supervisor</option>
                                <option value="Manager">Manager</option>
                                <option value="Director">Director</option>
                            </select>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Link href="/dashboard/organization/departments">
                            <Button variant="outline" type="button">{t?.organization?.position?.new?.cancel || 'Batal'}</Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting}>
                            <Save className="mr-2 h-4 w-4" /> {t?.organization?.position?.new?.save || 'Simpan'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
