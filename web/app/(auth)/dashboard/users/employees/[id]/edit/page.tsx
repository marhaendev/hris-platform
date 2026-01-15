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
import { toast } from 'sonner';

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

export default function EditEmployeePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);

    const [selectedDeptId, setSelectedDeptId] = useState<string>('');
    const [selectedPosId, setSelectedPosId] = useState<string>('');
    const [deptOpen, setDeptOpen] = useState(false);

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [userId, setUserId] = useState<number | null>(null);
    const [phone, setPhone] = useState('');
    const [usernameCheck, setUsernameCheck] = useState<{ available: boolean, message?: string }>({ available: true });
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [deptRes, posRes, empRes] = await Promise.all([
                    fetch('/api/departments'),
                    fetch('/api/positions'),
                    fetch('/api/employees')
                ]);

                const depts = await deptRes.json();
                const pos = await posRes.json();
                const emps = await empRes.json();

                setDepartments(depts);
                setPositions(pos);

                const employee = emps.find((e: any) => e.id.toString() === params.id);
                if (employee) {
                    setName(employee.user.name);
                    setUsername(employee.user.username);
                    setUserId(employee.user.id);
                    setPhone(employee.user.phone || '');
                    setSelectedDeptId(employee.departmentId?.toString() || '');
                    setSelectedPosId(employee.positionId?.toString() || '');
                } else {
                    setError("Karyawan tidak ditemukan");
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
                setError("Gagal memuat data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [params.id]);

    // Check username availability when it changes
    useEffect(() => {
        const checkUsername = async () => {
            if (!username || username.length < 3) {
                setUsernameCheck({ available: true });
                return;
            }

            // Don't check if it matches initial username (handled by excludeId efficiently)
            setIsCheckingUsername(true);
            try {
                let url = `/api/user/check-username?username=${username}`;
                if (userId) {
                    url += `&excludeId=${userId}`;
                }
                const res = await fetch(url);
                const data = await res.json();

                if (data.available) {
                    setUsernameCheck({ available: true, message: 'Username tersedia ✅' });
                } else {
                    setUsernameCheck({ available: false, message: `Username sudah dipakai ❌. Saran: ${data.suggestion}` });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsCheckingUsername(false);
            }
        };

        const timeoutId = setTimeout(checkUsername, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [username, userId]);

    const filteredPositions = positions.filter(p => String(p.departmentId) === String(selectedDeptId));

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setIsSaving(true);

        if (!selectedDeptId || !selectedPosId) {
            setError("Mohon pilih Departemen dan Posisi.");
            setIsSaving(false);
            return;
        }

        const data = {
            id: Number(params.id),
            name,
            username,
            phone,
            departmentId: Number(selectedDeptId),
            positionId: Number(selectedPosId),
        };

        try {
            const res = await fetch('/api/employees', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error);
                setIsSaving(false);
            } else {
                toast.success("Data karyawan berhasil diperbarui");
                router.push(`/dashboard/users/employees/${params.id}`);
                router.refresh();
            }
        } catch (err) {
            setError("Terjadi kesalahan saat menyimpan");
            setIsSaving(false);
        }
    }

    if (isLoading) return (
        <div className="p-8 flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="p-6 w-full space-y-6 text-slate-800">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/users/employees/${params.id}`}><ChevronLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Karyawan</h1>
                    <p className="text-slate-500">Perbarui informasi data karyawan</p>
                </div>
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle>Formulir Pengeditan</CardTitle>
                    <CardDescription>Sesuaikan detail informasi karyawan di bawah ini.</CardDescription>
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
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username (Login)</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                                    className={cn(
                                        "font-mono h-11",
                                        !usernameCheck.available ? "border-red-500 focus-visible:ring-red-500" :
                                            (username && usernameCheck.available ? "border-green-500 focus-visible:ring-green-500" : "")
                                    )}
                                />
                                {isCheckingUsername ? (
                                    <p className="text-[11px] text-slate-500">Memeriksa ketersediaan...</p>
                                ) : (
                                    <p className={cn("text-[11px] italic", !usernameCheck.available ? "text-red-500 font-bold" : "text-green-600")}>
                                        {usernameCheck.message || "Username unik untuk login."}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Nomor WhatsApp / HP <span className="text-slate-400 font-normal">(Opsional)</span></Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    placeholder="0812XXXXXXXX"
                                    className="h-11"
                                />
                            </div>

                            <div className="w-full"></div>
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
                                            className="w-full justify-between font-normal h-11"
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
                                                            onSelect={() => {
                                                                setSelectedDeptId(dept.id.toString());
                                                                setDeptOpen(false);
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
                            </div>

                            <div className="space-y-2">
                                <Label>Posisi / Jabatan {selectedDeptId && <span className="text-xs text-slate-400 font-normal">({filteredPositions.length} tersedia)</span>}</Label>
                                <Select
                                    value={selectedPosId}
                                    onValueChange={setSelectedPosId}
                                    disabled={!selectedDeptId}
                                    required
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder={!selectedDeptId ? "Pilih Departemen Dulu" : "Pilih Posisi"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredPositions.map(pos => (
                                            <SelectItem key={pos.id} value={pos.id.toString()}>
                                                {pos.title} <span className="text-slate-400 text-xs ml-2">({pos.level})</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="pt-6 border-t flex justify-end gap-3">
                            <Button variant="outline" type="button" asChild className="h-11 px-6">
                                <Link href={`/dashboard/users/employees/${params.id}`}>Batal</Link>
                            </Button>
                            <Button type="submit" disabled={isSaving} className="h-11 px-8 bg-primary hover:bg-primary/90 font-bold shadow-md shadow-primary/10">
                                {isSaving ? "Menyimpan..." : <><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</>}
                            </Button>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
