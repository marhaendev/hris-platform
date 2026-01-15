'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Search, CreditCard } from 'lucide-react';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface PaymentMethod {
    id: number;
    name: string;
    type: string;
    description: string;
    is_active: number;
}

export default function MasterPaymentMethodsPage() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
    const [banks, setBanks] = useState<{ id: number; name: string }[]>([]);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    useEffect(() => {
        const loadBanks = async () => {
            try {
                const res = await fetch('/api/admin/master-banks');
                if (res.ok) setBanks(await res.json());
            } catch (e) { console.error("Failed to load banks"); }
        };
        loadBanks();
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        type: "BANK",
        description: "",
    });

    const fetchMethods = async () => {
        setLoading(true);
        try {
            // In a real app, this would be an API call. For now we simulate or use a server action if setup.
            // Since we don't have the API endpoint yet, we'll implement a simple one or mock it?
            // Wait, I should implement the API route too to be complete.
            // Let's assume the API exists for now, or I'll create it in the next step.
            const res = await fetch('/api/admin/master-payment-methods');
            if (res.ok) {
                const data = await res.json();
                setMethods(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMethods();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingMethod ? 'PUT' : 'POST';
            const url = editingMethod
                ? `/api/admin/master-payment-methods?id=${editingMethod.id}`
                : '/api/admin/master-payment-methods';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success(editingMethod ? "Data diperbarui" : "Data ditambahkan");
            setIsDialogOpen(false);
            fetchMethods();
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
            const res = await fetch(`/api/admin/master-payment-methods?id=${deleteTargetId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Data dihapus");
                fetchMethods();
            }
        } catch (e) { toast.error("Gagal menghapus"); }
        setDeleteTargetId(null);
    };

    const resetForm = () => {
        setFormData({ name: "", type: "BANK", description: "" });
        setEditingMethod(null);
    };

    const openEdit = (m: PaymentMethod) => {
        setEditingMethod(m);
        setFormData({ name: m.name, type: m.type, description: m.description });
        setIsDialogOpen(true);
    };

    const filteredMethods = methods.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.type.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Master Metode Pembayaran</h1>
                    <p className="text-muted-foreground">Kelola daftar metode pembayaran (Bank, E-Wallet, QRIS).</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah Baru
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingMethod ? 'Edit Metode' : 'Tambah Metode Baru'}</DialogTitle>
                            <DialogDescription>
                                Isi detail metode pembayaran di bawah ini.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nama Metode</Label>
                                <Input
                                    placeholder="Contoh: BCA Transfer"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipe</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="BANK">Bank Transfer</option>
                                    <option value="EWALLET">E-Wallet</option>
                                    <option value="QRIS">QRIS</option>
                                    <option value="OTHER">Lainnya</option>
                                </select>
                            </div>

                            {formData.type === 'BANK' && (
                                <div className="space-y-2">
                                    <Label>Pilih Bank</Label>
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        onChange={(e) => {
                                            const b = banks.find(x => x.id === parseInt(e.target.value));
                                            if (b) {
                                                setFormData({
                                                    ...formData,
                                                    name: b.name,
                                                    description: `Transfer ke ${b.name}`
                                                });
                                            }
                                        }}
                                        value={banks.find(x => x.name === formData.name)?.id || ""}
                                    >
                                        <option value="">-- Manual / Pilih Bank --</option>
                                        {banks.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-muted-foreground">Opsi ini akan otomatis mengisi Nama Metode.</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Deskripsi</Label>
                                <Input
                                    placeholder="Keterangan singkat"
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
                    placeholder="Cari metode..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Memuat data...</TableCell>
                            </TableRow>
                        ) : filteredMethods.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell>
                            </TableRow>
                        ) : (
                            filteredMethods.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <CreditCard className="h-4 w-4 text-slate-500" />
                                        </div>
                                        {m.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{m.type}</Badge>
                                    </TableCell>
                                    <TableCell>{m.description}</TableCell>
                                    <TableCell>
                                        <Badge className={m.is_active ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700"}>
                                            {m.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                                                <Pencil className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
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
                title="Hapus Metode Pembayaran?"
                description="Metode pembayaran ini akan dihapus permanen."
                confirmText="Ya, Hapus"
                variant="danger"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
