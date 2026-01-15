'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { ConfirmDialog } from "@/components/confirm-dialog";

interface FAQ {
    id: number;
    question: string;
    answer: string;
    is_active: number;
    display_order: number;
}

export default function FAQPage() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    // Form State
    const [form, setForm] = useState({
        question: '',
        answer: '',
        is_active: 1,
        display_order: 0
    });

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/faqs');
            const data = await res.json();
            setFaqs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch FAQs", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingFaq(null);
        setForm({ question: '', answer: '', is_active: 1, display_order: 0 });
        setDialogOpen(true);
    };

    const handleEdit = (faq: FAQ) => {
        setEditingFaq(faq);
        setForm({
            question: faq.question,
            answer: faq.answer,
            is_active: faq.is_active,
            display_order: faq.display_order
        });
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.question || !form.answer) { toast.error('Pertanyaan dan Jawaban wajib diisi'); return; }

        setIsSaving(true);
        try {
            const method = editingFaq ? 'PUT' : 'POST';
            const body = editingFaq ? { ...form, id: editingFaq.id } : form;

            const res = await fetch('/api/faqs', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success(editingFaq ? 'FAQ berhasil diperbarui!' : 'FAQ berhasil ditambahkan!');
                setDialogOpen(false);
                fetchFaqs();
            } else {
                toast.error('Gagal menyimpan FAQ');
            }
        } catch (error) {
            console.error(error);
            toast.error('Terjadi kesalahan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
            const res = await fetch(`/api/faqs?id=${deleteTargetId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('FAQ berhasil dihapus!');
                fetchFaqs();
            } else {
                toast.error('Gagal menghapus FAQ');
            }
        } catch (error) {
            console.error(error);
        }
        setDeleteTargetId(null);
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">FAQ Management</h2>
                    <p className="text-slate-500">Kelola pertanyaan umum yang sering diajukan.</p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah FAQ
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar FAQ</CardTitle>
                    <CardDescription>
                        Total {faqs.length} pertanyaan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <p className="text-center py-8 text-slate-500">Loading...</p>
                    ) : faqs.length === 0 ? (
                        <p className="text-center py-8 text-slate-500">Belum ada FAQ.</p>
                    ) : (
                        faqs.map((faq) => (
                            <div key={faq.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded">
                                            <HelpCircle className="h-4 w-4" />
                                        </div>
                                        <h3 className="font-semibold">{faq.question}</h3>
                                        {!faq.is_active && (
                                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Draft</span>
                                        )}
                                    </div>
                                    <p className="text-slate-600 text-sm whitespace-pre-wrap pl-8">{faq.answer}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(faq)}>
                                        <Edit className="h-4 w-4 text-slate-500" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(faq.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Tambah FAQ Baru'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Pertanyaan</Label>
                            <Input
                                value={form.question}
                                onChange={(e) => setForm({ ...form, question: e.target.value })}
                                placeholder="Contoh: Bagaimana cara melamar?"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Jawaban</Label>
                            <Textarea
                                value={form.answer}
                                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                                placeholder="Tulis jawaban lengkap..."
                                rows={4}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="space-y-2 flex-1">
                                <Label>Urutan</Label>
                                <Input
                                    type="number"
                                    value={form.display_order}
                                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    className="h-4 w-4 rounded border-gray-300"
                                    checked={form.is_active === 1}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
                                />
                                <Label htmlFor="is_active">Aktif ditampilkan</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Batal</Button>
                        <Button onClick={handleSubmit} disabled={isSaving}>
                            {isSaving ? "Menyimpan..." : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Hapus FAQ?"
                description="FAQ ini akan dihapus secara permanen dan tidak dapat dikembalikan."
                confirmText="Ya, Hapus"
                variant="danger"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
