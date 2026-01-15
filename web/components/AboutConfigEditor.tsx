'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, RotateCcw, Info, User, CheckCircle2 } from "lucide-react";

interface AboutConfigEditorProps {
    initialValue: string | null;
    onSave: (value: string) => void;
    isLoading?: boolean;
}

export function AboutConfigEditor({ initialValue, onSave, isLoading }: AboutConfigEditorProps) {
    const [config, setConfig] = useState<any>(null);
    const [isBlockFormat, setIsBlockFormat] = useState(false);

    useEffect(() => {
        if (initialValue) {
            try {
                const parsed = JSON.parse(initialValue);
                if (parsed.blocks) {
                    setIsBlockFormat(true);
                    setConfig(parsed);
                } else {
                    setIsBlockFormat(false);
                    setConfig({
                        title: '',
                        subtitle: '',
                        context: { title: '', subtitle: '', desc1: '', role: '', desc2: '', system: '', desc3: '' },
                        candidate: {
                            title: '',
                            position: '', positionVal: '',
                            subject: '', subjectVal: '',
                            assignmentDate: '', assignmentDateVal: '',
                            deadline: '', deadlineVal: '',
                            submissionDate: '', submissionDateVal: ''
                        },
                        quote: '',
                        ...parsed
                    });
                }
            } catch (e) {
                console.error("Failed to parse initial config", e);
            }
        } else {
            setConfig({
                title: '',
                subtitle: '',
                context: { title: '', subtitle: '', desc1: '', role: '', desc2: '', system: '', desc3: '' },
                candidate: {
                    title: '',
                    position: '', positionVal: '',
                    subject: '', subjectVal: '',
                    assignmentDate: '', assignmentDateVal: '',
                    deadline: '', deadlineVal: '',
                    submissionDate: '', submissionDateVal: ''
                },
                quote: ''
            });
        }
    }, [initialValue]);

    if (!config) return null;

    if (isBlockFormat) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                    <Save className="h-10 w-10" />
                </div>
                <div className="space-y-2 max-w-sm">
                    <h3 className="text-lg font-bold">Format Data Modular Terdeteksi</h3>
                    <p className="text-sm text-slate-500">
                        Perusahaan ini menggunakan konfigurasi halaman 'Tentang' berbasis blok yang lebih modern.
                    </p>
                </div>
                <Button asChild className="font-bold">
                    <a href="/dashboard/about">Buka Editor Visual di Halaman Tentang</a>
                </Button>
                <div className="w-full border-t pt-6 mt-6">
                    <Label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Editor JSON (Advanced)</Label>
                    <Textarea
                        className="font-mono text-xs h-[200px]"
                        value={JSON.stringify(config, null, 2)}
                        onChange={(e) => {
                            try {
                                const val = JSON.parse(e.target.value);
                                setConfig(val);
                            } catch (err) { }
                        }}
                    />
                    <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 w-full text-xs"
                        onClick={() => onSave(JSON.stringify(config))}
                    >
                        Simpan via JSON
                    </Button>
                </div>
            </div>
        );
    }

    const handleChange = (path: string, value: any) => {
        const parts = path.split('.');
        setConfig((prev: any) => {
            const next = { ...prev };
            let current = next;
            for (let i = 0; i < parts.length - 1; i++) {
                current[parts[i]] = { ...current[parts[i]] };
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;
            return next;
        });
    };

    const handleReset = () => {
        if (confirm("Reset ke pengaturan default? Perubahan yang belum disimpan akan hilang.")) {
            setConfig({
                title: '',
                subtitle: '',
                context: { title: '', subtitle: '', desc1: '', role: '', desc2: '', system: '', desc3: '' },
                candidate: {
                    title: '',
                    position: '', positionVal: '',
                    subject: '', subjectVal: '',
                    assignmentDate: '', assignmentDateVal: '',
                    deadline: '', deadlineVal: '',
                    submissionDate: '', submissionDateVal: ''
                },
                quote: ''
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[10px] flex items-center gap-2">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span>Peringatan: Menyimpan dari sini akan mengonversi data ke format lama. Disarankan menggunakan <strong>Editor Visual</strong> di halaman Tentang.</span>
            </div>
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general" className="flex gap-2"><Info className="h-4 w-4" /> Umum</TabsTrigger>
                    <TabsTrigger value="candidate" className="flex gap-2"><User className="h-4 w-4" /> Kandidat</TabsTrigger>
                    <TabsTrigger value="requirements" className="flex gap-2"><CheckCircle2 className="h-4 w-4" /> Fitur</TabsTrigger>
                </TabsList>

                <div className="h-[350px] mt-4 pr-4 overflow-y-auto">
                    <TabsContent value="general" className="space-y-4">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>Judul Utama Halaman</Label>
                                <Input
                                    value={config.title}
                                    onChange={e => handleChange('title', e.target.value)}
                                    placeholder="Tentang Aplikasi"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Sub-judul</Label>
                                <Input
                                    value={config.subtitle}
                                    onChange={e => handleChange('subtitle', e.target.value)}
                                    placeholder="Informasi mengenai aplikasi ini."
                                />
                            </div>
                            <div className="border-t pt-4 mt-2">
                                <h4 className="text-sm font-bold mb-4">Konteks Proyek</h4>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label>Judul Konteks</Label>
                                        <Input
                                            value={config.context?.title}
                                            onChange={e => handleChange('context.title', e.target.value)}
                                            placeholder="Submission Test Teknis"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Sub-judul Konteks</Label>
                                        <Input
                                            value={config.context?.subtitle}
                                            onChange={e => handleChange('context.subtitle', e.target.value)}
                                            placeholder="PT Citra Borneo Indah - Recruitment"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Deskripsi 1 (Sebelum Role)</Label>
                                        <Input
                                            value={config.context?.desc1}
                                            onChange={e => handleChange('context.desc1', e.target.value)}
                                            placeholder="Aplikasi ini dikembangkan untuk posisi"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role / Posisi</Label>
                                        <Input
                                            value={config.context?.role}
                                            onChange={e => handleChange('context.role', e.target.value)}
                                            placeholder="Staff Application Development"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Deskripsi 2 (Sebelum Nama Sistem)</Label>
                                        <Input
                                            value={config.context?.desc2}
                                            onChange={e => handleChange('context.desc2', e.target.value)}
                                            placeholder="Proyek ini mendemonstrasikan sistem"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nama Sistem</Label>
                                        <Input
                                            value={config.context?.system}
                                            onChange={e => handleChange('context.system', e.target.value)}
                                            placeholder="HRIS (Human Resource Information System)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Deskripsi 3 (Penutup)</Label>
                                        <Input
                                            value={config.context?.desc3}
                                            onChange={e => handleChange('context.desc3', e.target.value)}
                                            placeholder="yang modern dan responsif."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 border-t pt-4">
                                <Label>Quote / Slogan (Bawah)</Label>
                                <Input
                                    value={config.quote}
                                    onChange={e => handleChange('quote', e.target.value)}
                                    placeholder="Becoming The Best World-Class Plantation Company"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="candidate" className="space-y-4">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>Judul Kartu Kandidat</Label>
                                <Input
                                    value={config.candidate?.title}
                                    onChange={e => handleChange('candidate.title', e.target.value)}
                                    placeholder="Informasi Kandidat"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div className="space-y-2">
                                    <Label>Label Posisi</Label>
                                    <Input value={config.candidate?.position} onChange={e => handleChange('candidate.position', e.target.value)} placeholder="Posisi" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nilai Posisi</Label>
                                    <Input value={config.candidate?.positionVal} onChange={e => handleChange('candidate.positionVal', e.target.value)} placeholder="Staff App Dev" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Label Subjek</Label>
                                    <Input value={config.candidate?.subject} onChange={e => handleChange('candidate.subject', e.target.value)} placeholder="Subjek" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nilai Subjek</Label>
                                    <Input value={config.candidate?.subjectVal} onChange={e => handleChange('candidate.subjectVal', e.target.value)} placeholder="Frontend Test" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Label Tgl Tugas</Label>
                                    <Input value={config.candidate?.assignmentDate} onChange={e => handleChange('candidate.assignmentDate', e.target.value)} placeholder="Tanggal Tugas" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nilai Tgl Tugas</Label>
                                    <Input value={config.candidate?.assignmentDateVal} onChange={e => handleChange('candidate.assignmentDateVal', e.target.value)} placeholder="9 Jan 2026" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Label Deadline</Label>
                                    <Input value={config.candidate?.deadline} onChange={e => handleChange('candidate.deadline', e.target.value)} placeholder="Batas Waktu" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nilai Deadline</Label>
                                    <Input value={config.candidate?.deadlineVal} onChange={e => handleChange('candidate.deadlineVal', e.target.value)} placeholder="20 Jan 2026" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Label Pengumpulan</Label>
                                    <Input value={config.candidate?.submissionDate} onChange={e => handleChange('candidate.submissionDate', e.target.value)} placeholder="Pengumpulan" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nilai Pengumpulan</Label>
                                    <Input value={config.candidate?.submissionDateVal} onChange={e => handleChange('candidate.submissionDateVal', e.target.value)} placeholder="14 Jan 2026" />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="requirements" className="space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs text-center italic">
                            Fitur Requirements dan Features List saat ini masih menggunakan data default sistem untuk menjaga konsistensi pengerjaan tes. Hanya judul dan deskripsi umum yang dapat diubah secara dinamis.
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Judul Requirements</Label>
                                <Input
                                    value={config.requirements?.title}
                                    onChange={e => handleChange('requirements.title', e.target.value)}
                                    placeholder="Fitur yang Diharapkan"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Sub-judul Requirements</Label>
                                <Input
                                    value={config.requirements?.subtitle}
                                    onChange={e => handleChange('requirements.subtitle', e.target.value)}
                                    placeholder="Berdasarkan Dokumen Tes Teknis"
                                />
                            </div>
                            <div className="space-y-2 pt-4 border-t">
                                <Label>Judul Fitur Lengkap</Label>
                                <Input
                                    value={config.features?.title}
                                    onChange={e => handleChange('features.title', e.target.value)}
                                    placeholder="Fitur Lengkap Aplikasi"
                                />
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" type="button" onClick={handleReset} disabled={isLoading}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Reset
                </Button>
                <Button type="button" onClick={() => onSave(JSON.stringify(config))} disabled={isLoading}>
                    {isLoading ? "Menyimpan..." : <><Save className="h-4 w-4 mr-2" /> Simpan Konfigurasi</>}
                </Button>
            </div>
        </div>
    );
}
