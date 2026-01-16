'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Briefcase, Pencil, Trash2, Plus, Check, Loader2, ChevronDown, ChevronUp, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Department {
    id: number;
    name: string;
    code: string;
}

interface Position {
    id: number;
    title: string;
    level: string;
    departmentId: number;
}

interface MasterPosition {
    id: number;
    title: string;
    defaultLevel: string;
    category: string;
}

interface Employee {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    positionId: number;
}

export default function DepartmentDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [dept, setDept] = useState<Department | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [masterPositions, setMasterPositions] = useState<MasterPosition[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [expandedPosIds, setExpandedPosIds] = useState<number[]>([]);

    // Dept Form
    const [form, setForm] = useState({ name: '', code: '' });

    // New Position Form
    const [newPosTitle, setNewPosTitle] = useState('');
    const [newPosLevel, setNewPosLevel] = useState('Staff');
    const [isAddingPos, setIsAddingPos] = useState(false);
    const [suggestions, setSuggestions] = useState<MasterPosition[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Edit Position State
    const [editingPosId, setEditingPosId] = useState<number | null>(null);
    const [editPosTitle, setEditPosTitle] = useState('');
    const [editPosLevel, setEditPosLevel] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingPos, setIsSavingPos] = useState(false);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleteEmptyConfirmOpen, setDeleteEmptyConfirmOpen] = useState(false);

    const { t } = useLanguage();
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // ... existing useEffects ...

    // ... existing handlers ...

    // ... handleSaveDept ...
    // ... handleAddPosition ...
    // ... handleDeletePos ...
    // ... confirmDelete ...
    // ... startEditing, cancelEditing, handleUpdatePosition ...
    // ... selectSuggestion, toggleExpand ...

    // RENDER SECTION UP TO CARD HEADER
    /* Need to match context perfectly so I don't break the file. 
       Actually, I gave too much instruction above. 
       Let's just inject the state and logic, then separate replace for UI.
       Wait, replace_file_content supports replacing a larger block.
    */


    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Department
                const deptRes = await fetch(`/api/departments?id=${params.id}`);
                if (!deptRes.ok) {
                    toast.error(t?.organization?.toast?.notFound || 'Departemen tidak ditemukan');
                    router.push('/dashboard/organization/departments');
                    return;
                }
                const deptData = await deptRes.json();
                setDept(deptData);
                setForm({ name: deptData.name, code: deptData.code });

                // Fetch Positions
                const posRes = await fetch(`/api/positions?departmentId=${params.id}`);
                setPositions(await posRes.json());

                // Fetch Employees for this Department (to link with positions)
                const empRes = await fetch(`/api/employees?departmentId=${params.id}`);
                setEmployees(await empRes.json());

                // Fetch Master Positions (for suggestions)
                const masterRes = await fetch('/api/master-positions');
                if (masterRes.ok) {
                    setMasterPositions(await masterRes.json());
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();

        // Click outside listener for suggestions
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [params.id, router, t]);

    // Handle suggestion filtering
    useEffect(() => {
        if (newPosTitle) {
            const filtered = masterPositions.filter(mp =>
                mp.title.toLowerCase().includes(newPosTitle.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [newPosTitle, masterPositions]);

    const handleSaveDept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.code) { toast.error(t?.organization?.toast?.fillData || 'Mohon lengkapi data'); return; }

        setIsSaving(true);
        try {
            const res = await fetch('/api/departments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, id: params.id })
            });

            if (res.ok) {
                toast.success(t?.organization?.toast?.updateSuccess || 'Perubahan disimpan');
                router.refresh();
            } else {
                toast.error(t?.organization?.toast?.updateFailed || 'Gagal menyimpan');
            }
        } catch (error) {
            console.error(error);
            toast.error(t?.organization?.toast?.error || 'Terjadi kesalahan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddPosition = async () => {
        if (!newPosTitle) return;

        setIsSavingPos(true);
        try {
            const res = await fetch('/api/positions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newPosTitle,
                    level: newPosLevel,
                    departmentId: params.id
                })
            });

            if (res.ok) {
                toast.success('Posisi berhasil ditambahkan');
                const newPos = await res.json();
                // Refresh list
                const posRes = await fetch(`/api/positions?departmentId=${params.id}`);
                setPositions(await posRes.json());

                // Reset form
                setNewPosTitle('');
                setNewPosLevel('Staff');
                setIsAddingPos(false);
            } else {
                toast.error('Gagal menambahkan posisi');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setIsSavingPos(false);
        }
    };

    const handleDeletePos = async (posId: number) => {
        setDeleteTargetId(posId);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        await fetch(`/api/positions?id=${deleteTargetId}`, { method: 'DELETE' });
        toast.success(t?.organization?.toast?.positionDeleteSuccess || 'Posisi berhasil dihapus!');

        // Optimistic update
        setPositions(positions.filter(p => p.id !== deleteTargetId));
        setDeleteTargetId(null);
    };

    const startEditing = (pos: Position) => {
        setEditingPosId(pos.id);
        setEditPosTitle(pos.title);
        setEditPosLevel(pos.level);
    };

    const cancelEditing = () => {
        setEditingPosId(null);
        setEditPosTitle('');
        setEditPosLevel('');
    };

    const handleUpdatePosition = async (id: number) => {
        try {
            const res = await fetch('/api/positions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    title: editPosTitle,
                    level: editPosLevel,
                    departmentId: params.id
                })
            });

            if (res.ok) {
                toast.success('Posisi berhasil diperbarui');
                const posRes = await fetch(`/api/positions?departmentId=${params.id}`);
                setPositions(await posRes.json());
                cancelEditing();
            } else {
                toast.error('Gagal memperbarui posisi');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        }
    };

    const selectSuggestion = (mp: MasterPosition) => {
        setNewPosTitle(mp.title);
        setNewPosLevel(mp.defaultLevel || 'Staff');
        setShowSuggestions(false);
    };

    const toggleExpand = (posId: number) => {
        setExpandedPosIds(prev =>
            prev.includes(posId) ? prev.filter(id => id !== posId) : [...prev, posId]
        );
    };

    const emptyPositions = positions.filter(pos => !employees.some(e => e.positionId === pos.id));

    const handleDeleteEmpty = () => {
        setDeleteEmptyConfirmOpen(true);
    };

    const confirmDeleteEmpty = async () => {
        setIsSavingPos(true);
        try {
            await Promise.all(emptyPositions.map(pos =>
                fetch(`/api/positions?id=${pos.id}`, { method: 'DELETE' })
            ));

            toast.success(`${emptyPositions.length} posisi kosong berhasil dihapus`);

            // Refresh
            const posRes = await fetch(`/api/positions?departmentId=${params.id}`);
            setPositions(await posRes.json());
        } catch (error) {
            toast.error('Gagal menghapus beberapa posisi');
        } finally {
            setIsSavingPos(false);
            setDeleteEmptyConfirmOpen(false);
        }
    };

    if (isLoading) return <div className="p-8 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
    if (!dept) return null;

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <Link href="/dashboard/organization/departments" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors bg-white w-fit px-3 py-1.5 rounded-md border shadow-sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t?.organization?.edit?.back || 'Kembali'}
            </Link>

            <div className="space-y-8">
                {/* Department Info */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-slate-800">{t?.organization?.edit?.title || 'Informasi Departemen'}</CardTitle>
                        <CardDescription>{t?.organization?.edit?.subtitle || 'Ubah informasi departemen.'}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSaveDept}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t?.organization?.edit?.nameLabel || 'Nama Departemen'}</Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">{t?.organization?.edit?.codeLabel || 'Kode Departemen'}</Label>
                                <Input
                                    id="code"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end bg-slate-50/50 py-3">
                            <Button type="submit" disabled={isSaving} size="sm">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {t?.organization?.edit?.saveButton || 'Simpan Perubahan'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Positions Management */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold tracking-tight text-slate-800">{t?.organization?.edit?.positionsTitle || 'Struktur Jabatan'}</h2>
                    </div>

                    <Card>
                        <CardHeader className="pb-3 border-b bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle className="text-base text-slate-700">Daftar Posisi</CardTitle>
                                <CardDescription>Jabatan yang ada dalam departemen ini.</CardDescription>
                            </div>
                            {emptyPositions.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 text-xs bg-red-50 text-red-600 hover:bg-red-100 border-red-200 border shadow-none"
                                    onClick={handleDeleteEmpty}
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Hapus {emptyPositions.length} Posisi Kosong
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 max-h-[800px] overflow-y-auto">
                                {positions.length === 0 && !isAddingPos ? (
                                    <div className="text-sm text-slate-500 italic p-8 text-center bg-slate-50/30">
                                        {t?.organization?.edit?.noPositions || 'Belum ada posisi.'}
                                        <br />
                                        <Button variant="link" onClick={() => setIsAddingPos(true)} className="mt-2">
                                            + Tambah Posisi Pertama
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {positions.map((pos) => {
                                            const posEmployees = employees.filter(e => e.positionId === pos.id);
                                            const hasEmployees = posEmployees.length > 0;
                                            const isExpanded = expandedPosIds.includes(pos.id);

                                            return (
                                                <div key={pos.id} className="group hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center justify-between p-4">
                                                        {editingPosId === pos.id ? (
                                                            <div className="flex items-center gap-2 w-full">
                                                                <Input
                                                                    value={editPosTitle}
                                                                    onChange={(e) => setEditPosTitle(e.target.value)}
                                                                    className="h-8 text-sm"
                                                                    autoFocus
                                                                />
                                                                <select
                                                                    className="flex h-8 w-32 items-center justify-between rounded-md border border-input bg-background px-2 text-xs"
                                                                    value={editPosLevel}
                                                                    onChange={(e) => setEditPosLevel(e.target.value)}
                                                                >
                                                                    <option value="Intern">Intern</option>
                                                                    <option value="Staff">Staff</option>
                                                                    <option value="Senior Staff">Senior Staff</option>
                                                                    <option value="Supervisor">Supervisor</option>
                                                                    <option value="Manager">Manager</option>
                                                                    <option value="Director">Director</option>
                                                                </select>
                                                                <Button size="sm" variant="ghost" onClick={() => handleUpdatePosition(pos.id)} className="h-8 w-8 text-green-600"><Check className="h-4 w-4" /></Button>
                                                                <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-8 w-8 text-slate-400"><ArrowLeft className="h-4 w-4" /></Button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                                        <Briefcase className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-slate-900">{pos.title}</div>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <Badge variant="secondary" className="text-[10px] font-normal text-slate-500">{pos.level}</Badge>
                                                                            {hasEmployees && (
                                                                                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded-full">
                                                                                    {posEmployees.length} Karyawan
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    {hasEmployees ? (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-8 gap-1 text-slate-500 hover:text-blue-600"
                                                                            onClick={() => toggleExpand(pos.id)}
                                                                        >
                                                                            <span className="text-xs">{isExpanded ? 'Tutup' : 'Lihat'}</span>
                                                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                                        </Button>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={() => startEditing(pos)}>
                                                                                <Pencil className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeletePos(pos.id)}>
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Expanded Employee List */}
                                                    {isExpanded && hasEmployees && (
                                                        <div className="bg-slate-50/50 border-t border-slate-100 px-4 py-3 animate-in slide-in-from-top-1">
                                                            <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Daftar Karyawan</div>
                                                            <div className="grid gap-2">
                                                                {posEmployees.map(emp => (
                                                                    <div key={emp.id} className="flex items-center justify-between p-2 bg-white rounded border border-slate-100 hover:border-blue-200 transition-colors">
                                                                        <div className="flex items-center gap-3">
                                                                            <Avatar className="h-8 w-8">
                                                                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                                                    {emp.user.name.substring(0, 2).toUpperCase()}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <div>
                                                                                <div className="text-sm font-medium text-slate-700">{emp.user.name}</div>
                                                                                <div className="text-xs text-slate-400">{emp.user.email}</div>
                                                                            </div>
                                                                        </div>
                                                                        <Link href={`/dashboard/users/employees/${emp.id}`}>
                                                                            <Button variant="outline" size="sm" className="h-7 text-xs">
                                                                                Detail
                                                                            </Button>
                                                                        </Link>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        </CardContent>

                        {/* Footer / Add Area */}
                        <div className="p-4 border-t bg-slate-50">
                            {isAddingPos ? (
                                <div className="bg-white p-3 rounded-lg border shadow-sm space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="grid gap-3">
                                        <div className="space-y-1 relative" ref={suggestionsRef}>
                                            <Label htmlFor="newPos" className="text-xs">Nama Posisi</Label>
                                            <Input
                                                id="newPos"
                                                value={newPosTitle}
                                                onChange={(e) => setNewPosTitle(e.target.value)}
                                                placeholder="Ketik nama posisi (e.g. Senior Staff)..."
                                                className="h-9"
                                                autoFocus
                                            />
                                            {/* Suggestions Dropdown */}
                                            {showSuggestions && suggestions.length > 0 && (
                                                <div className="absolute w-full z-50 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                    <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">Saran dari Master Data</div>
                                                    {suggestions.map((mp) => (
                                                        <button
                                                            key={mp.id}
                                                            type="button"
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-slate-700 flex justify-between items-center"
                                                            onClick={() => selectSuggestion(mp)}
                                                        >
                                                            <span>{mp.title}</span>
                                                            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{mp.category}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="newLevel" className="text-xs">Level</Label>
                                            <select
                                                id="newLevel"
                                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={newPosLevel}
                                                onChange={(e) => setNewPosLevel(e.target.value)}
                                            >
                                                <option value="Intern">Intern</option>
                                                <option value="Staff">Staff</option>
                                                <option value="Senior Staff">Senior Staff</option>
                                                <option value="Supervisor">Supervisor</option>
                                                <option value="Manager">Manager</option>
                                                <option value="Director">Director</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <Button variant="ghost" size="sm" onClick={() => setIsAddingPos(false)} className="h-8">Batal</Button>
                                        <Button onClick={handleAddPosition} size="sm" className="h-8" disabled={isSavingPos || !newPosTitle}>
                                            {isSavingPos ? 'Menyimpan...' : 'Simpan Posisi'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button variant="outline" className="w-full border-dashed text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5" onClick={() => setIsAddingPos(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Tambah Posisi Baru
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={t?.organization?.position?.confirmDelete?.title || 'Hapus Posisi?'}
                description={t?.organization?.position?.confirmDelete?.description || 'Posisi ini akan dihapus secara permanen dari departemen.'}
                confirmText={t?.organization?.confirmDelete?.confirm || 'Ya, Hapus'}
                variant="danger"
                onConfirm={confirmDelete}
            />

            <ConfirmDialog
                open={deleteEmptyConfirmOpen}
                onOpenChange={setDeleteEmptyConfirmOpen}
                title="Hapus Posisi Kosong?"
                description={`Anda akan menghapus ${emptyPositions.length} posisi yang tidak memiliki karyawan. Tindakan ini tidak dapat dikembalikan.`}
                confirmText={`Ya, Hapus ${emptyPositions.length} Posisi`}
                variant="danger"
                onConfirm={confirmDeleteEmpty}
            />
        </div>
    );
}
