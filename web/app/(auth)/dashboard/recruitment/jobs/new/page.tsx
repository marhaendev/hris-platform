'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ArrowLeft, Save, Check, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Department {
    id: number;
    name: string;
}

interface Position {
    id: number;
    title: string;
}

const INDONESIAN_CITIES = [
    "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang",
    "Makassar", "Palembang", "Tangerang", "Depok", "Bekasi",
    "Bogor", "Yogyakarta", "Malang", "Denpasar", "Balikpapan",
    "Pontianak", "Manado", "Batam", "Pekanbaru", "Banjarmasin",
    "Remote", "Hybrid"
];

const SALARY_SUGGESTIONS = [
    5000000, 5500000, 6000000, 6500000, 7000000, 7500000,
    8000000, 8500000, 9000000, 9500000, 10000000, 12000000,
    15000000, 20000000, 25000000, 30000000
];

export default function NewJobPage() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [form, setForm] = useState({
        title: '',
        departmentId: '',
        positionId: '',
        description: '',
        requirements: '',
        status: 'DRAFT',
        salary_min: '',
        salary_max: '',
        location: '',
        employment_type: 'FULL_TIME',
        posted_date: '',
        closing_date: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [salaryMinSuggestions, setSalaryMinSuggestions] = useState<number[]>([]);
    const [salaryMaxSuggestions, setSalaryMaxSuggestions] = useState<number[]>([]);
    const [showMinSuggestions, setShowMinSuggestions] = useState(false);

    const [showMaxSuggestions, setShowMaxSuggestions] = useState(false);
    const [openDept, setOpenDept] = useState(false);
    const [openPos, setOpenPos] = useState(false);

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (form.departmentId) {
            fetchPositions(form.departmentId);
        }
    }, [form.departmentId]);

    const fetchDepartments = async () => {
        const res = await fetch('/api/departments?all=true');
        const data = await res.json();
        setDepartments(Array.isArray(data) ? data : []);
    };

    const fetchPositions = async (deptId: string) => {
        const res = await fetch(`/api/positions?departmentId=${deptId}`);
        const data = await res.json();
        setPositions(Array.isArray(data) ? data : []);
    };

    const formatNumber = (value: string) => {
        const num = value.replace(/\D/g, '');
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleSalaryMinChange = (value: string) => {
        const numValue = value.replace(/\D/g, '');
        setForm({ ...form, salary_min: numValue });

        if (numValue.length > 0) {
            const filtered = SALARY_SUGGESTIONS.filter(s =>
                s.toString().startsWith(numValue)
            );
            setSalaryMinSuggestions(filtered);
            setShowMinSuggestions(filtered.length > 0);
        } else {
            setShowMinSuggestions(false);
        }
    };

    const handleSalaryMaxChange = (value: string) => {
        const numValue = value.replace(/\D/g, '');
        setForm({ ...form, salary_max: numValue });

        if (numValue.length > 0) {
            const filtered = SALARY_SUGGESTIONS.filter(s =>
                s.toString().startsWith(numValue)
            );
            setSalaryMaxSuggestions(filtered);
            setShowMaxSuggestions(filtered.length > 0);
        } else {
            setShowMaxSuggestions(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Title is optional (auto-filled by backend if empty)

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/recruitment/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    departmentId: form.departmentId ? parseInt(form.departmentId) : null,
                    positionId: form.positionId ? parseInt(form.positionId) : null,
                    salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
                    salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
                })
            });

            if (res.ok) {
                toast.success('Lowongan berhasil disimpan!');
                router.push('/dashboard/recruitment/jobs');
                router.refresh();
            } else {
                toast.error('Gagal menyimpan lowongan');
            }
        } catch (error) {
            console.error(error);
            toast.error('Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <Link href="/dashboard/recruitment/jobs" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors bg-white w-fit px-3 py-1.5 rounded-md border shadow-sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
            </Link>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Buat Lowongan Baru</CardTitle>
                    <CardDescription>Isi detail lowongan pekerjaan.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Judul Loker <span className="text-xs text-slate-500 font-normal">(Opsional / Auto-fill)</span></Label>
                                <Input
                                    id="title"
                                    placeholder="Contoh: Senior Backend Engineer"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Lokasi</Label>
                                <select
                                    id="location"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                >
                                    <option value="">Pilih Lokasi</option>
                                    {INDONESIAN_CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2 flex flex-col">
                                <Label className="mb-1">Departemen</Label>
                                <Popover open={openDept} onOpenChange={setOpenDept}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openDept}
                                            className="w-full justify-between font-normal"
                                        >
                                            {form.departmentId
                                                ? departments.find((dept) => dept.id.toString() === form.departmentId)?.name
                                                : "Pilih Departemen"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Cari departemen..." />
                                            <CommandList>
                                                <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {departments.map((dept) => (
                                                        <CommandItem
                                                            key={dept.id}
                                                            value={dept.name}
                                                            onSelect={() => {
                                                                setForm({ ...form, departmentId: dept.id.toString(), positionId: '' });
                                                                setOpenDept(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    form.departmentId === dept.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {dept.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <Label className="mb-1">Posisi</Label>
                                <Popover open={openPos} onOpenChange={setOpenPos}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openPos}
                                            className="w-full justify-between font-normal"
                                            disabled={!form.departmentId}
                                        >
                                            {form.positionId
                                                ? positions.find((pos) => pos.id.toString() === form.positionId)?.title
                                                : "Pilih Posisi"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Cari posisi..." />
                                            <CommandList>
                                                <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {positions.map((pos) => (
                                                        <CommandItem
                                                            key={pos.id}
                                                            value={pos.title}
                                                            onSelect={() => {
                                                                setForm({
                                                                    ...form,
                                                                    positionId: pos.id.toString(),
                                                                    title: (!form.title) ? pos.title : form.title
                                                                });
                                                                setOpenPos(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    form.positionId === pos.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {pos.title}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi Pekerjaan</Label>
                            <Textarea
                                id="description"
                                placeholder="Jelaskan tanggung jawab dan tugas..."
                                rows={4}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requirements">Persyaratan</Label>
                            <Textarea
                                id="requirements"
                                placeholder="Jelaskan kualifikasi yang dibutuhkan..."
                                rows={4}
                                value={form.requirements}
                                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                            />
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2 relative">
                                <Label htmlFor="salary_min">Gaji Min (Rp)</Label>
                                <Input
                                    id="salary_min"
                                    placeholder="5.000.000"
                                    value={formatNumber(form.salary_min)}
                                    onChange={(e) => handleSalaryMinChange(e.target.value)}
                                    onFocus={() => form.salary_min && setShowMinSuggestions(salaryMinSuggestions.length > 0)}
                                    onBlur={() => setTimeout(() => setShowMinSuggestions(false), 200)}
                                />
                                {showMinSuggestions && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                        {salaryMinSuggestions.map(amount => (
                                            <button
                                                key={amount}
                                                type="button"
                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                                                onMouseDown={(e) => {
                                                    e.preventDefault(); // Prevent input from losing focus immediately
                                                    setForm({ ...form, salary_min: amount.toString() });
                                                    setShowMinSuggestions(false);
                                                }}
                                            >
                                                Rp {amount.toLocaleString('id-ID')}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 relative">
                                <Label htmlFor="salary_max">Gaji Max (Rp)</Label>
                                <Input
                                    id="salary_max"
                                    placeholder="10.000.000"
                                    value={formatNumber(form.salary_max)}
                                    onChange={(e) => handleSalaryMaxChange(e.target.value)}
                                    onFocus={() => form.salary_max && setShowMaxSuggestions(salaryMaxSuggestions.length > 0)}
                                    onBlur={() => setTimeout(() => setShowMaxSuggestions(false), 200)}
                                />
                                {showMaxSuggestions && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                        {salaryMaxSuggestions.map(amount => (
                                            <button
                                                key={amount}
                                                type="button"
                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setForm({ ...form, salary_max: amount.toString() });
                                                    setShowMaxSuggestions(false);
                                                }}
                                            >
                                                Rp {amount.toLocaleString('id-ID')}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="employment_type">Tipe Pekerjaan</Label>
                                <select
                                    id="employment_type"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={form.employment_type}
                                    onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                                >
                                    <option value="FULL_TIME">Full Time</option>
                                    <option value="PART_TIME">Part Time</option>
                                    <option value="CONTRACT">Contract</option>
                                    <option value="INTERN">Intern</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="OPEN">Open</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="posted_date">Tanggal Posting <span className="text-xs text-slate-500 font-normal">(Kosongkan untuk waktu sekarang)</span></Label>
                                <Input
                                    id="posted_date"
                                    type="date"
                                    value={form.posted_date}
                                    onChange={(e) => setForm({ ...form, posted_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="closing_date">Tanggal Tutup</Label>
                                <Input
                                    id="closing_date"
                                    type="date"
                                    value={form.closing_date}
                                    onChange={(e) => setForm({ ...form, closing_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Link href="/dashboard/recruitment/jobs">
                            <Button variant="outline" type="button">Batal</Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting}>
                            <Save className="mr-2 h-4 w-4" /> Simpan
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
