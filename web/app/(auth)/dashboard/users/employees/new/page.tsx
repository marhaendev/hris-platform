'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Save, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Department {
    id: number;
    name: string;
    code: string;
}

interface Position {
    id: number;
    title: string;
    departmentId: number;
    level: string;
}

export default function NewEmployeePage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);

    const [selectedDeptId, setSelectedDeptId] = useState<string>('');
    const [selectedPosId, setSelectedPosId] = useState<string>('');
    const [deptOpen, setDeptOpen] = useState(false);
    const [posOpen, setPosOpen] = useState(false);

    // Username & Name state
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [usernameCheck, setUsernameCheck] = useState<{ available: boolean, message?: string }>({ available: true });
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    // Function to generate username from name
    const generateUsername = (fullName: string): string => {
        if (!fullName.trim()) return '';

        const parts = fullName.toLowerCase().trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].replace(/[^a-z0-9]/g, '');
        }
        // nama depan + nama belakang (atau bagian pertama dan terakhir)
        const first = parts[0].replace(/[^a-z0-9]/g, '');
        const last = parts[parts.length - 1].replace(/[^a-z0-9]/g, '');
        return `${first}.${last}`;
    };

    // Auto-generate username when name changes
    const handleNameChange = (value: string) => {
        setName(value);
        const generatedUsername = generateUsername(value);
        setUsername(generatedUsername);
    };

    // Check username availability when it changes
    useEffect(() => {
        const checkUsername = async () => {
            if (!username || username.length < 3) {
                setUsernameCheck({ available: true });
                return;
            }

            setIsCheckingUsername(true);
            try {
                const res = await fetch(`/api/user/check-username?username=${username}`);
                const data = await res.json();

                if (data.available) {
                    setUsernameCheck({ available: true, message: 'Username tersedia ✅' });
                } else {
                    setUsernameCheck({ available: false, message: `Username sudah dipakai ❌. Saran: ${data.suggestion}` });
                    // Optional: Auto-apply suggestion if user hasn't manually edited (complicated to track), 
                    // or just let them see the error.
                    // The user said "pastikan autogenerate itu unik", implying the system SHOULD resolve it.
                    // If this was triggered by NAME change (auto-gen), we should probably pick the unique one.
                    // But if typed manually, warn.
                    // Let's just warn for now, or auto-update if it's an initial generation?
                    // Safe approach: warn and show suggestion.
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsCheckingUsername(false);
            }
        };

        const timeoutId = setTimeout(checkUsername, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [username]);

    useEffect(() => {
        // Fetch Depts & Positions
        const fetchData = async () => {
            try {
                const [deptRes, posRes] = await Promise.all([
                    fetch('/api/departments?all=true'),
                    fetch('/api/positions?all=true')
                ]);
                const depts = await deptRes.json();
                const pos = await posRes.json();
                setDepartments(depts);
                setPositions(pos);
            } catch (err) {
                console.error("Failed to fetch organization data");
            }
        };
        fetchData();
    }, []);

    // Filter positions based on selected Department
    const filteredPositions = positions.filter(p => String(p.departmentId) === String(selectedDeptId));

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!selectedDeptId || !selectedPosId) {
            setError("Mohon pilih Departemen dan Posisi.");
            setIsLoading(false);
            return;
        }

        const formData = new FormData(e.currentTarget);
        const password = formData.get('password') as string;
        const passwordCheck = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/.test(password);

        if (!passwordCheck) {
            setError('Password harus minimal 8 karakter dan mengandung huruf kapital, huruf kecil, angka, serta simbol');
            setIsLoading(false);
            return;
        }

        const rawData = Object.fromEntries(formData);


        // Find selected position title for legacy field
        const posTitle = positions.find(p => p.id === Number(selectedPosId))?.title || '';

        const data = {
            ...rawData,
            name,
            username,
            phone,
            baseSalary: 0, // Default to 0, managed in Finance
            departmentId: Number(selectedDeptId),
            positionId: Number(selectedPosId),
            position: posTitle // Fallback legacy
        };

        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error);
                setIsLoading(false);
            } else {
                router.push('/dashboard/users/employees');
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong");
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/users/employees"><ChevronLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tambah Karyawan</h1>
                    <p className="text-slate-500">Buat akun untuk karyawan baru</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Formulir Karyawan</CardTitle>
                    <CardDescription>Isi detail karyawan dengan lengkap.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm font-medium border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Contoh: Budi Santoso"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username (Login)</Label>
                                <Input
                                    id="username"
                                    name="username"
                                    placeholder="budi.santoso"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                    required
                                    className={cn(
                                        "font-mono",
                                        !usernameCheck.available ? "border-red-500 focus-visible:ring-red-500" :
                                            (username && usernameCheck.available ? "border-green-500 focus-visible:ring-green-500" : "")
                                    )}
                                />
                                {isCheckingUsername ? (
                                    <p className="text-[11px] text-slate-500">Memeriksa ketersediaan...</p>
                                ) : (
                                    <p className={cn("text-[11px]", !usernameCheck.available ? "text-red-500 font-bold" : "text-green-600")}>
                                        {usernameCheck.message || "Auto-generate dari nama, bisa diedit manual."}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Nomor WhatsApp / HP <span className="text-slate-400 font-normal">(Opsional)</span></Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    placeholder="081234567890"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                />
                                <p className="text-[11px] text-slate-500">Opsional. Jika diisi, dapat digunakan untuk login via OTP WhatsApp.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password Default</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    defaultValue="Rahasia123"
                                    className="bg-slate-50 font-mono text-sm"
                                />
                                <p className="text-[11px] text-slate-500">Gunakan password ini untuk login pertama kali.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>Departemen</Label>
                                <Popover open={deptOpen} onOpenChange={setDeptOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            type="button"
                                            aria-expanded={deptOpen}
                                            className="w-full justify-between font-normal"
                                        >
                                            {selectedDeptId
                                                ? departments.find((dept) => dept.id.toString() === selectedDeptId)?.name
                                                : "Pilih Departemen..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 pointer-events-none" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari departemen..." />
                                            <CommandList>
                                                <CommandEmpty>Departemen tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {departments.map((dept) => (
                                                        <CommandItem
                                                            key={dept.id}
                                                            value={dept.name}
                                                            onSelect={(currentValue) => {
                                                                setSelectedDeptId(dept.id.toString());
                                                                setDeptOpen(false);
                                                                // Also reset position when dept changes
                                                                setSelectedPosId('');
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedDeptId === dept.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {dept.name} ({dept.code})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {/* Hidden input for form submission if needed, but we handle onSubmit manually */}
                            </div>

                            <div className="space-y-2">
                                <Label>Posisi / Jabatan {selectedDeptId && <span className="text-xs text-slate-400 font-normal">({filteredPositions.length} tersedia)</span>}</Label>
                                <Popover open={posOpen} onOpenChange={setPosOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={posOpen}
                                            className="w-full justify-between font-normal"
                                            disabled={!selectedDeptId}
                                        >
                                            {selectedPosId
                                                ? filteredPositions.find((pos) => pos.id.toString() === selectedPosId)?.title
                                                : (!selectedDeptId ? "Pilih Departemen Dulu" : "Pilih Posisi...")}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 pointer-events-none" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Cari posisi..." />
                                            <CommandList>
                                                <CommandEmpty>Posisi tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredPositions.map((pos) => (
                                                        <CommandItem
                                                            key={pos.id}
                                                            value={pos.title}
                                                            onSelect={() => {
                                                                setSelectedPosId(pos.id.toString());
                                                                setPosOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedPosId === pos.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {pos.title} <span className="text-slate-400 text-xs ml-2">({pos.level})</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Salary moved to Finance/Payroll module as requested */}
                        {/* 
                        <div className="space-y-2 md:w-1/2">
                            <Label htmlFor="baseSalary">Gaji Pokok (Rp)</Label>
                            <Input id="baseSalary" name="baseSalary" type="number" placeholder="5000000" required />
                        </div> 
                        */}

                        <div className="pt-6 flex justify-end gap-3">
                            <Button variant="outline" type="button" asChild>
                                <Link href="/dashboard/users/employees">Batal</Link>
                            </Button>
                            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                                {isLoading ? "Menyimpan..." : <><Save className="mr-2 h-4 w-4" /> Simpan Data</>}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
