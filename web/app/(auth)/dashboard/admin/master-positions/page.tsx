
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from "@/components/confirm-dialog";

interface MasterPosition {
    id: number;
    title: string;
    defaultLevel: string;
    category: string;
}

export default function MasterPositionsPage() {
    const [positions, setPositions] = useState<MasterPosition[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ id: 0, title: '', defaultLevel: 'Staff', category: 'General' });
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const fetchPositions = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/master-positions?q=${encodeURIComponent(search)}`);
            const data = await res.json();
            setPositions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPositions();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = '/api/admin/master-positions';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(isEditing ? 'Posisi berhasil diperbarui!' : 'Posisi berhasil ditambahkan!');
                setIsDialogOpen(false);
                setFormData({ id: 0, title: '', defaultLevel: 'Staff', category: 'General' });
                fetchPositions();
            } else {
                toast.error('Gagal menyimpan');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
            await fetch(`/api/admin/master-positions?id=${deleteTargetId}`, { method: 'DELETE' });
            toast.success('Posisi berhasil dihapus!');
            fetchPositions();
        } catch (error) {
            console.error(error);
        }
        setDeleteTargetId(null);
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">Master Posisi</h2>
                    <p className="text-muted-foreground">Kelola daftar posisi standar untuk seluruh sistem.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => { setIsEditing(false); setFormData({ id: 0, title: '', defaultLevel: 'Staff', category: 'General' }); }}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah Posisi Core
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{isEditing ? 'Edit Posisi' : 'Tambah Posisi Baru'}</DialogTitle>
                                <DialogDescription>
                                    Posisi ini akan muncul sebagai saran di semua perusahaan.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="title" className="text-right">Judul</Label>
                                        <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="level" className="text-right">Default Level</Label>
                                        <select
                                            id="level"
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                                            value={formData.defaultLevel}
                                            onChange={(e) => setFormData({ ...formData, defaultLevel: e.target.value })}
                                        >
                                            <option value="Intern">Intern</option>
                                            <option value="Staff">Staff</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Director">Director</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="category" className="text-right">Kategori</Label>
                                        <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="col-span-3" placeholder="e.g. IT, HR, General" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Simpan</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Cari posisi..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Judul</TableHead>
                                <TableHead>Default Level</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">Loading...</TableCell>
                                </TableRow>
                            ) : positions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">Tidak ada data.</TableCell>
                                </TableRow>
                            ) : (
                                positions.map((pos) => (
                                    <TableRow key={pos.id}>
                                        <TableCell className="font-medium">{pos.title}</TableCell>
                                        <TableCell>{pos.defaultLevel}</TableCell>
                                        <TableCell>{pos.category}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                setFormData({ id: pos.id, title: pos.title, defaultLevel: pos.defaultLevel, category: pos.category || '' });
                                                setIsEditing(true);
                                                setIsDialogOpen(true);
                                            }}>
                                                <Pencil className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(pos.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Hapus Posisi Core?"
                description="Posisi core ini akan dihapus dari sistem."
                confirmText="Ya, Hapus"
                variant="danger"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
