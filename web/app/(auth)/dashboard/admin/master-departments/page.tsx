'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Search, Building } from 'lucide-react';
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface MasterDepartment {
    id: number;
    name: string;
    code: string;
    description: string;
}

export default function MasterDepartmentsPage() {
    const [depts, setDepts] = useState<MasterDepartment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<MasterDepartment | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
    });

    const fetchDepts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/master-departments?q=${encodeURIComponent(search)}`);
            if (res.ok) {
                const data = await res.json();
                setDepts(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDepts();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingDept ? 'PUT' : 'POST';
            const url = '/api/admin/master-departments';
            const body = editingDept ? { ...formData, id: editingDept.id } : formData;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success(editingDept ? "Data diperbarui" : "Data ditambahkan");
            setIsDialogOpen(false);
            fetchDepts();
            resetForm();
        } catch (error) {
            toast.error("Gagal menyimpan data");
        }
    };

    const handleDelete = async (id: number) => {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
            const res = await fetch(`/api/admin/master-departments?id=${deleteTargetId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Data dihapus");
                fetchDepts();
            }
        } catch (e) { toast.error("Gagal menghapus"); }
        setDeleteTargetId(null);
    };

    const resetForm = () => {
        setFormData({ name: "", code: "", description: "" });
        setEditingDept(null);
    };

    const openEdit = (d: MasterDepartment) => {
        setEditingDept(d);
        setFormData({ name: d.name, code: d.code, description: d.description });
        setIsDialogOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Master Departemen</h1>
                    <p className="text-muted-foreground">Kelola daftar departemen standar.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah Departemen
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingDept ? 'Edit Departemen' : 'Tambah Departemen Baru'}</DialogTitle>
                            <DialogDescription>
                                Departemen ini akan menjadi template standar.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nama Departemen</Label>
                                <Input
                                    placeholder="Contoh: Engineering"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Kode</Label>
                                <Input
                                    placeholder="Contoh: ENG"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Deskripsi</Label>
                                <Input
                                    placeholder="Deskripsi singkat"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Simpan</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-slate-500" />
                <Input
                    placeholder="Cari departemen..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kode</TableHead>
                            <TableHead>Nama Departemen</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">Memuat data...</TableCell>
                            </TableRow>
                        ) : depts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell>
                            </TableRow>
                        ) : (
                            depts.map((d) => (
                                <TableRow key={d.id}>
                                    <TableCell className="font-mono">{d.code || '-'}</TableCell>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Building className="h-4 w-4 text-slate-400" />
                                        {d.name}
                                    </TableCell>
                                    <TableCell>{d.description}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                                                <Pencil className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Hapus Departemen?"
                description="Data departemen ini akan dihapus permanen."
                confirmText="Ya, Hapus"
                variant="danger"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
