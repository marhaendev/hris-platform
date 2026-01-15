'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Search, Building2 } from 'lucide-react';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface Bank {
    id: number;
    code: string;
    name: string;
}

export default function MasterBanksPage() {
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBank, setEditingBank] = useState<Bank | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        code: "",
        name: "",
    });

    const fetchBanks = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/master-banks');
            if (res.ok) {
                const data = await res.json();
                setBanks(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanks();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingBank ? 'PUT' : 'POST';
            const url = editingBank
                ? `/api/admin/master-banks?id=${editingBank.id}`
                : '/api/admin/master-banks';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success(editingBank ? "Data diperbarui" : "Data ditambahkan");
            setIsDialogOpen(false);
            fetchBanks();
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
            const res = await fetch(`/api/admin/master-banks?id=${deleteTargetId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Data dihapus");
                fetchBanks();
            }
        } catch (e) { toast.error("Gagal menghapus"); }
        setDeleteTargetId(null);
    };

    const resetForm = () => {
        setFormData({ code: "", name: "" });
        setEditingBank(null);
    };

    const openEdit = (b: Bank) => {
        setEditingBank(b);
        setFormData({ code: b.code, name: b.name });
        setIsDialogOpen(true);
    };

    const filteredBanks = banks.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Master Bank</h1>
                    <p className="text-muted-foreground">Kelola daftar bank untuk integrasi pembayaran.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah Baru
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingBank ? 'Edit Bank' : 'Tambah Bank Baru'}</DialogTitle>
                            <DialogDescription>
                                Isi detail bank di bawah ini.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Kode Bank</Label>
                                <Input
                                    placeholder="Contoh: BCA"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nama Bank</Label>
                                <Input
                                    placeholder="Contoh: Bank Central Asia"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
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
                    placeholder="Cari bank..."
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
                            <TableHead>Nama Bank</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8">Memuat data...</TableCell>
                            </TableRow>
                        ) : filteredBanks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell>
                            </TableRow>
                        ) : (
                            filteredBanks.map((b) => (
                                <TableRow key={b.id}>
                                    <TableCell className="font-mono font-medium">{b.code}</TableCell>
                                    <TableCell className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-slate-400" />
                                        {b.name}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                                                <Pencil className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
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
                title="Hapus Bank?"
                description="Data bank ini akan dihapus permanen."
                confirmText="Ya, Hapus"
                variant="danger"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
