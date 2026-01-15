'use client';

import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    BookOpen, Code2, Server, Terminal, User, Link as LinkIcon,
    Github, Youtube, CheckCircle2, Loader2, Plus, Trash2,
    ArrowUp, ArrowDown, Layout, Copy, Save, X, Edit2, ChevronDown, ChevronUp,
    Figma, FileText, Globe, Linkedin, Twitter, Instagram, Facebook, Gitlab, Mail, MessageCircle
} from "lucide-react";

// Icon Map for dynamic rendering
const ICON_MAP: Record<string, any> = {
    'github': Github,
    'youtube': Youtube,
    'figma': Figma,
    'docs': FileText,
    'web': Globe,
    'linkedin': Linkedin,
    'twitter': Twitter,
    'instagram': Instagram,
    'facebook': Facebook,
    'gitlab': Gitlab,
    'email': Mail,
    'whatsapp': MessageCircle,
    'default': LinkIcon
};
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function AboutPage() {
    const { t } = useLanguage();
    const [companyData, setCompanyData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [blocks, setBlocks] = useState<any[]>([]);
    const [originalBlocks, setOriginalBlocks] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);
    const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);

    // Block types and their default data
    const BLOCK_TEMPLATES: Record<string, any> = {
        header: { title: t.aboutPage.title, subtitle: t.aboutPage.subtitle },
        context: {
            title: t.aboutPage.context.title,
            subtitle: t.aboutPage.context.subtitle,
            desc1: t.aboutPage.context.desc1,
            role: t.aboutPage.context.role,
            desc2: t.aboutPage.context.desc2,
            system: t.aboutPage.context.system,
            desc3: t.aboutPage.context.desc3
        },
        tech_stack: {
            title: t.aboutPage.techStack.title,
            frontend: [
                { name: "Next.js 14 (App Router)", color: "default" },
                { name: "React", color: "default" },
                { name: "TypeScript", color: "default" },
                { name: "Tailwind CSS", color: "default" },
                { name: "Shadcn/UI", color: "default" },
                { name: "Lucide Icons", color: "default" }
            ],
            backend: [
                { name: "Node.js", color: "default" },
                { name: "Express.js (Bot API)", color: "default" },
                { name: "Baileys (WhatsApp Web API)", color: "default" },
                { name: "SQLite (Better-Sqlite3)", color: "default" },
                { name: "Native SQL", color: "default" },
                { name: "JWT Authentication", color: "default" },
                { name: "Docker", color: "default" },
                { name: "Docker Compose", color: "default" }
            ]
        },
        candidate: {
            title: t.aboutPage.candidate.title,
            fields: [
                { label: t.aboutPage.candidate.position, value: "Staff Application Development" },
                { label: t.aboutPage.candidate.subject, value: "Frontend & Backend Test" },
                { label: t.aboutPage.candidate.assignmentDate, value: "9 January 2026" },
                { label: t.aboutPage.candidate.deadline, value: "20 January 2026" },
                { label: t.aboutPage.candidate.submissionDate, value: "14 January 2026" }
            ],
            quote: t.aboutPage.quote
        },
        requirements: {
            title: t.aboutPage.requirements?.title || "Fitur yang Diharapkan",
            subtitle: t.aboutPage.requirements?.subtitle || "Berdasarkan Dokumen Tes Teknis",
            list: t.aboutPage.requirements?.list || {}
        },
        features: {
            title: t.aboutPage.features?.title || "Fitur Lengkap Aplikasi",
            list: t.aboutPage.features?.list || {}
        },
        submission: {
            title: "Submission Links",
            links: [
                { type: "github", label: "Source Code", url: "#" },
                { type: "youtube", label: "Video Demo", url: "#" }
            ]
        }
    };

    const fetchCompanyData = async () => {
        setIsLoading(true);
        try {
            const [compRes, sessionRes] = await Promise.all([
                fetch('/api/organization/company'),
                fetch('/api/auth/session')
            ]);

            if (sessionRes.ok) {
                const session = await sessionRes.json();
                setUserRole(session.role);
            }

            if (compRes.ok) {
                const data = await compRes.json();
                const comp = Array.isArray(data) ? data[0] : data;
                setCompanyData(comp);

                if (comp) {
                    if (comp.about_config) {
                        try {
                            const config = JSON.parse(comp.about_config);
                            if (config.blocks) {
                                setBlocks(config.blocks);
                                setOriginalBlocks(config.blocks);
                            } else {
                                // Migration logic from old format to block format
                                const migrated = migrateOldFormat(config, comp.name);
                                setBlocks(migrated);
                                setOriginalBlocks(migrated);
                            }
                        } catch (e) {
                            console.error("Failed to parse config", e);
                            const defaultBlocks = getDefaultBlocks(comp.name);
                            setBlocks(defaultBlocks);
                            setOriginalBlocks(defaultBlocks);
                        }
                    } else {
                        const defaultBlocks = getDefaultBlocks(comp.name);
                        setBlocks(defaultBlocks);
                        setOriginalBlocks(defaultBlocks);
                    }
                } else {
                    // Global Context or No Company Handling
                    // We can show a default "Global" view or empty
                    setBlocks(getDefaultBlocks("Global Company"));
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const migrateOldFormat = (old: any, companyName?: string) => {
        const result: any[] = [
            { id: 'b1', type: 'header', data: { title: old.title || t.aboutPage.title, subtitle: old.subtitle || t.aboutPage.subtitle } },
            {
                id: 'b2',
                type: 'context',
                data: {
                    ...BLOCK_TEMPLATES.context, // Start with defaults
                    ...old.context, // Override with old values
                    // Ensure subtitle uses company name if old.context.subtitle is missing or matches default
                    subtitle: old.context?.subtitle || (companyName ? `${companyName} - Recruitment` : t.aboutPage.context.subtitle)
                }
            },
            { id: 'b3', type: 'tech_stack', data: BLOCK_TEMPLATES.tech_stack },
            {
                id: 'b4', type: 'candidate', data: {
                    title: old.candidate?.title || t.aboutPage.candidate.title,
                    fields: [
                        { label: old.candidate?.position || t.aboutPage.candidate.position, value: old.candidate?.positionVal || "Staff App Dev" },
                        { label: old.candidate?.subject || t.aboutPage.candidate.subject, value: old.candidate?.subjectVal || "Technical Test" },
                        { label: old.candidate?.assignmentDate || t.aboutPage.candidate.assignmentDate, value: old.candidate?.assignmentDateVal || "9 Jan 2026" },
                        { label: old.candidate?.deadline || t.aboutPage.candidate.deadline, value: old.candidate?.deadlineVal || "20 Jan 2026" },
                        { label: old.candidate?.submissionDate || t.aboutPage.candidate.submissionDate, value: old.candidate?.submissionDateVal || "14 Jan 2026" }
                    ],
                    quote: old.quote || t.aboutPage.quote
                }
            },
            { id: 'b5', type: 'requirements', data: old.requirements || BLOCK_TEMPLATES.requirements },
            { id: 'b6', type: 'features', data: old.features || BLOCK_TEMPLATES.features },
            { id: 'b7', type: 'submission', data: BLOCK_TEMPLATES.submission }
        ];
        return result;
    };

    const getDefaultBlocks = (companyName?: string) => {
        const contextData = { ...BLOCK_TEMPLATES.context };
        if (companyName) {
            contextData.subtitle = `${companyName} - Recruitment`;
        }

        return [
            { id: 'b1', type: 'header', data: BLOCK_TEMPLATES.header },
            { id: 'b2', type: 'context', data: contextData },
            { id: 'b3', type: 'tech_stack', data: BLOCK_TEMPLATES.tech_stack },
            { id: 'b4', type: 'candidate', data: BLOCK_TEMPLATES.candidate },
            { id: 'b5', type: 'requirements', data: BLOCK_TEMPLATES.requirements },
            { id: 'b6', type: 'features', data: BLOCK_TEMPLATES.features },
            { id: 'b7', type: 'submission', data: BLOCK_TEMPLATES.submission }
        ];
    };

    useEffect(() => {
        fetchCompanyData();
    }, []);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/organization/company', {
                method: 'PUT',
                body: JSON.stringify({
                    id: companyData.id,
                    about_config: JSON.stringify({ blocks })
                })
            });
            if (res.ok) {
                toast.success("Halaman Tentang berhasil diperbarui");
                setOriginalBlocks(blocks);
                setIsEditMode(false);
            } else {
                toast.error("Gagal menyimpan perubahan");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setBlocks(originalBlocks);
        setIsEditMode(false);
    };

    const addBlock = (type: string) => {
        const newBlock = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            data: { ...BLOCK_TEMPLATES[type] }
        };
        setBlocks([...blocks, newBlock]);
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const newBlocks = [...blocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

        const temp = newBlocks[index];
        newBlocks[index] = newBlocks[targetIndex];
        newBlocks[targetIndex] = temp;
        setBlocks(newBlocks);
    };

    const updateBlockData = (id: string, newData: any) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, data: newData } : b));
    };

    const fetchOtherCompanies = async () => {
        const res = await fetch('/api/organization/company');
        if (res.ok) {
            const data = await res.json();
            setAvailableCompanies(data.filter((c: any) => c.id !== companyData?.id));
            setIsCopyDialogOpen(true);
        }
    };

    const copyFromCompany = (targetCompany: any) => {
        if (targetCompany.about_config) {
            try {
                const config = JSON.parse(targetCompany.about_config);
                if (config.blocks) {
                    setBlocks(config.blocks);
                } else {
                    setBlocks(migrateOldFormat(config));
                }
                toast.success(`Berhasil menyalin dari ${targetCompany.name}`);
                setIsCopyDialogOpen(false);
            } catch (e) {
                toast.error("Gagal menyalin konfigurasi");
            }
        } else {
            toast.error("Perusahaan tujuan belum memiliki konfigurasi kustom");
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const isSuperadmin = userRole === 'SUPERADMIN';

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 pb-20 relative min-h-screen bg-slate-50/30">
            {/* Editor Toolbar */}
            {isSuperadmin && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
                    {isEditMode ? (
                        <>
                            <div className="flex items-center gap-2 border-r pr-4">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 animate-pulse">Mode Edit Aktif</Badge>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="h-8 gap-2 rounded-lg">
                                            <Plus className="h-4 w-4" /> Tambah Blok
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Pilih Jenis Blok</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid grid-cols-2 gap-3 pt-4">
                                            {Object.keys(BLOCK_TEMPLATES).map(type => (
                                                <Button
                                                    key={type}
                                                    variant="outline"
                                                    className="h-24 flex-col gap-2 rounded-xl hover:border-primary hover:bg-primary/5 group"
                                                    onClick={() => addBlock(type)}
                                                >
                                                    <Layout className="h-5 w-5 text-slate-400 group-hover:text-primary" />
                                                    <span className="capitalize">{type.replace('_', ' ')}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <Button size="sm" variant="outline" className="h-8 gap-2 rounded-lg" onClick={fetchOtherCompanies}>
                                    <Copy className="h-4 w-4" /> Salin Perusahaan
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={handleCancel}>Batal</Button>
                                <Button size="sm" className="h-8 rounded-lg font-bold shadow-lg shadow-primary/20" onClick={handleSave}>
                                    <Save className="h-4 w-4 mr-2" /> Simpan Perubahan
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Button size="sm" className="h-10 px-6 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={() => setIsEditMode(true)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Edit Halaman
                        </Button>
                    )}
                </div>
            )}

            {/* Copy from Company Dialog */}
            <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Salin Konfigurasi dari Perusahaan Lain</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-4 max-h-[400px] overflow-y-auto pr-2">
                        {availableCompanies.length === 0 ? (
                            <p className="text-center text-slate-400 py-8 italic">Tidak ada perusahaan lain tersedia</p>
                        ) : (
                            availableCompanies.map(comp => (
                                <div key={comp.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50 transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{comp.name}</p>
                                        <p className="text-xs text-slate-400">{comp.whatsapp || '-'}</p>
                                    </div>
                                    <Button size="sm" onClick={() => copyFromCompany(comp)}>Salin</Button>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Render Blocks */}
            <div className="max-w-5xl mx-auto space-y-12">
                {blocks.map((block, index) => (
                    <div key={block.id} className="group relative">
                        {/* Block Controls */}
                        {isEditMode && (
                            <div className="absolute -left-14 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => moveBlock(index, 'up')} disabled={index === 0}>
                                    <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1}>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500" onClick={() => removeBlock(block.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {/* Rendering different block types */}
                        <div className={`${isEditMode ? 'ring-2 ring-transparent hover:ring-primary/20 p-2 rounded-xl transition-all' : ''}`}>
                            <BlockRenderer block={block} isEditMode={isEditMode} updateData={updateBlockData} />
                        </div>
                    </div>
                ))}

                {blocks.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed rounded-3xl border-slate-200">
                        <Layout className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="font-bold text-slate-400">Belum ada konten</h3>
                        <p className="text-sm text-slate-400">Gunakan toolbar di bawah untuk menambah blok</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- STABLE COMPONENTS OUTSIDE THE RENDER LOOP ---

const EditorWrapper = ({
    children,
    editor,
    type,
    isEditMode
}: {
    children: React.ReactNode,
    editor: React.ReactNode,
    type: string,
    isEditMode: boolean
}) => (
    <div className="relative">
        {children}
        {isEditMode && (
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="icon" variant="secondary" className="absolute -right-12 top-0 h-8 w-8 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Blok {type.replace('_', ' ')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-2">
                        {editor}
                    </div>
                </DialogContent>
            </Dialog>
        )}
    </div>
);

function BlockRenderer({ block, isEditMode, updateData }: { block: any, isEditMode: boolean, updateData: (id: string, data: any) => void }) {
    const { type, data, id } = block;

    switch (type) {
        case 'header':
            return (
                <EditorWrapper type={type} isEditMode={isEditMode} editor={
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Judul</Label>
                            <Input value={data.title} onChange={e => updateData(id, { ...data, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Sub-judul</Label>
                            <Input value={data.subtitle} onChange={e => updateData(id, { ...data, subtitle: e.target.value })} />
                        </div>
                    </div>
                }>
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">{data.title}</h2>
                        <p className="text-lg text-slate-500 font-medium">{data.subtitle}</p>
                    </div>
                </EditorWrapper>
            );

        case 'context':
            return (
                <EditorWrapper type={type} isEditMode={isEditMode} editor={
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Judul</Label>
                                <Input value={data.title} onChange={e => updateData(id, { ...data, title: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Sub-judul</Label>
                                <Input value={data.subtitle} onChange={e => updateData(id, { ...data, subtitle: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Deskripsi Awal</Label>
                            <Input value={data.desc1} onChange={e => updateData(id, { ...data, desc1: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Role/Posisi</Label>
                            <Input value={data.role} onChange={e => updateData(id, { ...data, role: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Nama Sistem</Label>
                            <Input value={data.system} onChange={e => updateData(id, { ...data, system: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Penutup</Label>
                            <Textarea value={data.desc3} onChange={e => updateData(id, { ...data, desc3: e.target.value })} />
                        </div>
                    </div>
                }>
                    <Card className="shadow-xl shadow-slate-200/50 border-slate-200 overflow-hidden group/card hover:border-primary/50 transition-all duration-300">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                {data.title}
                            </CardTitle>
                            <CardDescription className="font-medium">{data.subtitle}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100/50 text-slate-600 leading-relaxed relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <BookOpen className="h-32 w-32" />
                                </div>
                                <p className="mb-4 text-base">
                                    {data.desc1}
                                    <strong className="text-slate-900 bg-primary/5 px-2 py-1 rounded-lg"> {data.role}</strong>.
                                </p>
                                <p className="text-base">
                                    {data.desc2}
                                    <strong className="text-slate-900 border-b-2 border-primary/20"> {data.system}</strong> {data.desc3}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </EditorWrapper>
            );

        case 'tech_stack':
            return (
                <EditorWrapper type={type} isEditMode={isEditMode} editor={
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Judul</Label>
                            <Input value={data.title} onChange={e => updateData(id, { ...data, title: e.target.value })} />
                        </div>
                        <p className="text-xs text-slate-400 italic">Daftar teknologi saat ini bersifat statis untuk menjaga konsistensi pengerjaan tes.</p>
                    </div>
                }>
                    <Card className="shadow-xl shadow-slate-200/50 border-slate-200 hover:border-primary/50 transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-lg">
                                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                                    <Terminal className="h-5 w-5" />
                                </div>
                                {data.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                    <Code2 className="h-4 w-4 text-primary" /> {data.frontend_title || "Frontend"}
                                </h4>
                                <div className="flex gap-2 flex-wrap">
                                    {data.frontend?.map((tech: any, i: number) => (
                                        <Badge key={i} variant="outline" className="bg-white px-3 py-1 rounded-lg border-slate-200 hover:border-primary/30 transition-colors uppercase text-[10px] font-bold tracking-wider">{tech.name}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                    <Server className="h-4 w-4 text-purple-600" /> {data.backend_title || "Backend & Database"}
                                </h4>
                                <div className="flex gap-2 flex-wrap">
                                    {data.backend?.map((tech: any, i: number) => (
                                        <Badge key={i} variant="outline" className="bg-white px-3 py-1 rounded-lg border-slate-200 hover:border-primary/30 transition-colors uppercase text-[10px] font-bold tracking-wider">{tech.name}</Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </EditorWrapper>
            );

        case 'candidate':
            return (
                <EditorWrapper type={type} isEditMode={isEditMode} editor={
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Judul Kartu</Label>
                            <Input value={data.title} onChange={e => updateData(id, { ...data, title: e.target.value })} />
                        </div>
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label>Data Informasi</Label>
                                <Button size="sm" variant="outline" onClick={() => {
                                    const newFields = [...(data.fields || []), { label: 'New Label', value: 'New Value' }];
                                    updateData(id, { ...data, fields: newFields });
                                }}>
                                    <Plus className="h-4 w-4 mr-2" /> Tambah Data
                                </Button>
                            </div>
                            {data.fields?.map((f: any, i: number) => (
                                <div key={i} className="flex gap-2 items-start group/field">
                                    <div className="grid grid-cols-2 gap-2 flex-1">
                                        <Input placeholder="Label" value={f.label} onChange={e => {
                                            const newFields = [...data.fields];
                                            newFields[i].label = e.target.value;
                                            updateData(id, { ...data, fields: newFields });
                                        }} />
                                        <Input placeholder="Value" value={f.value} onChange={e => {
                                            const newFields = [...data.fields];
                                            newFields[i].value = e.target.value;
                                            updateData(id, { ...data, fields: newFields });
                                        }} />
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:text-red-500" onClick={() => {
                                        const newFields = data.fields.filter((_: any, idx: number) => idx !== i);
                                        updateData(id, { ...data, fields: newFields });
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label>Quotes / Slogan</Label>
                                <Button size="sm" variant="outline" onClick={() => {
                                    // Handle migration from string to array if needed
                                    const currentQuotes = Array.isArray(data.quotes) ? data.quotes : (data.quote ? [data.quote] : []);
                                    const newQuotes = [...currentQuotes, 'New Quote'];
                                    updateData(id, { ...data, quotes: newQuotes, quote: undefined }); // Remove legacy quote field
                                }}>
                                    <Plus className="h-4 w-4 mr-2" /> Tambah Quote
                                </Button>
                            </div>

                            {(Array.isArray(data.quotes) ? data.quotes : (data.quote ? [data.quote] : [])).map((q: string, i: number) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <Input
                                        value={q}
                                        onChange={e => {
                                            const currentQuotes = Array.isArray(data.quotes) ? [...data.quotes] : [data.quote];
                                            currentQuotes[i] = e.target.value;
                                            updateData(id, { ...data, quotes: currentQuotes, quote: undefined });
                                        }}
                                    />
                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:text-red-500" onClick={() => {
                                        const currentQuotes = Array.isArray(data.quotes) ? [...data.quotes] : [data.quote];
                                        const newQuotes = currentQuotes.filter((_: any, idx: number) => idx !== i);
                                        updateData(id, { ...data, quotes: newQuotes, quote: undefined });
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                }>
                    <Card className="shadow-xl shadow-slate-200/50 border-slate-200 hover:border-primary/50 transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-lg">
                                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                                    <User className="h-5 w-5" />
                                </div>
                                {data.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-0 text-sm overflow-hidden rounded-2xl border border-slate-100">
                                {data.fields?.map((f: any, i: number) => (
                                    <div key={i} className={`flex justify-between items-center p-4 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} ${i !== data.fields.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                        <span className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">{f.label}</span>
                                        <span className="font-bold text-slate-800 text-right">{f.value}</span>
                                    </div>
                                ))}
                            </div>

                            {(Array.isArray(data.quotes) && data.quotes.length > 0) || data.quote ? (
                                <div className="mt-8 pt-6 border-t border-dashed border-slate-200 text-center space-y-4">
                                    {(Array.isArray(data.quotes) ? data.quotes : [data.quote]).map((q: string, i: number) => (
                                        <p key={i} className="text-sm font-bold text-slate-400 italic">
                                            "{q}"
                                        </p>
                                    ))}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </EditorWrapper>
            );

        case 'requirements':
            return (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                {data.title}
                            </h3>
                            <p className="text-slate-500 font-medium ml-14 mt-1">{data.subtitle}</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {Object.entries(data.list || {}).map(([key, req]: [string, any]) => (
                            <Card key={key} className={`border-none shadow-xl shadow-slate-200/50 group/item overflow-hidden ${key === 'bonus' ? 'bg-gradient-to-br from-amber-50 to-orange-50/30' : 'bg-white'}`}>
                                <CardHeader className="pb-2 border-b border-slate-100/50">
                                    <CardTitle className={`text-sm font-black uppercase tracking-widest flex items-center justify-between ${key === 'bonus' ? 'text-amber-700' : 'text-slate-400'}`}>
                                        {req.title}
                                        {key === 'bonus' && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">TOP PRIORITY</Badge>}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <ul className="space-y-3">
                                        {req.items?.map((item: string, i: number) => (
                                            <li key={i} className="text-sm font-medium text-slate-600 flex items-start gap-3">
                                                <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${key === 'bonus' ? 'bg-amber-200 text-amber-700' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    <CheckCircle2 className="h-3 w-3" />
                                                </div>
                                                <span className="pt-0.5">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            );

        case 'features':
            return (
                <div className="space-y-6 pt-8">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Terminal className="h-7 w-7 text-primary" />
                        {data.title}
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                        {Object.entries(data.list || {}).map(([key, section]: [string, any]) => (
                            <Card key={key} className="border-slate-200/60 shadow-lg shadow-slate-100/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden bg-white/50 backdrop-blur-sm group/feat">
                                <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
                                    <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                                        {section.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 px-4 pb-6">
                                    <ul className="space-y-3">
                                        {section.items?.map((item: string, i: number) => (
                                            <li key={i} className="text-sm font-medium text-slate-500 leading-relaxed flex items-start gap-2.5">
                                                <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-emerald-100 text-emerald-600">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                </div>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            );

        case 'submission':
            return (
                <EditorWrapper type={type} isEditMode={isEditMode} editor={
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Judul Kartu</Label>
                            <Input value={data.title} onChange={e => updateData(id, { ...data, title: e.target.value })} />
                        </div>
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label>Daftar Link</Label>
                                <Button size="sm" variant="outline" onClick={() => {
                                    const newLinks = [...(data.links || []), { type: 'web', label: 'New Link', url: '#' }];
                                    updateData(id, { ...data, links: newLinks });
                                }}>
                                    <Plus className="h-4 w-4 mr-2" /> Tambah Link
                                </Button>
                            </div>

                            {data.links?.map((link: any, i: number) => (
                                <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-3 border relative group/item">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 absolute top-2 right-2 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                        onClick={() => {
                                            const newLinks = data.links.filter((_: any, idx: number) => idx !== i);
                                            updateData(id, { ...data, links: newLinks });
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>

                                    <div className="grid gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Jenis Icon</Label>
                                            <Select
                                                value={link.type}
                                                onValueChange={(val) => {
                                                    const newLinks = [...data.links];
                                                    newLinks[i].type = val;
                                                    updateData(id, { ...data, links: newLinks });
                                                }}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.keys(ICON_MAP).map(iconKey => (
                                                        <SelectItem key={iconKey} value={iconKey}>
                                                            <div className="flex items-center gap-2 capitalize">
                                                                {/* Render icon preview if possible, loosely */}
                                                                <span>{iconKey}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Label</Label>
                                                <Input
                                                    className="h-8"
                                                    value={link.label}
                                                    onChange={e => {
                                                        const newLinks = [...data.links];
                                                        newLinks[i].label = e.target.value;
                                                        updateData(id, { ...data, links: newLinks });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">URL</Label>
                                                <Input
                                                    className="h-8"
                                                    value={link.url}
                                                    onChange={e => {
                                                        const newLinks = [...data.links];
                                                        newLinks[i].url = e.target.value;
                                                        updateData(id, { ...data, links: newLinks });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                }>
                    <Card className="shadow-2xl shadow-emerald-200/20 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white overflow-hidden relative group/links">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <LinkIcon className="h-32 w-32 text-emerald-600" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-lg text-emerald-900">
                                <LinkIcon className="h-5 w-5" />
                                {data.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-4 relative z-10">
                            {data.links?.map((link: any, i: number) => {
                                const IconComp = ICON_MAP[link.type] || LinkIcon;
                                return (
                                    <Button key={i} variant="outline" className={`gap-3 h-12 px-6 rounded-xl border-emerald-200 font-bold bg-white text-slate-700 shadow-xl shadow-slate-200/20 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all`} asChild>
                                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                                            <IconComp className="h-5 w-5" /> {link.label}
                                        </a>
                                    </Button>
                                );
                            })}
                        </CardContent>
                    </Card>
                </EditorWrapper>
            );

        default:
            return <div className="p-4 border border-dashed rounded-lg text-slate-400">Tipe blok '{type}' belum didukung</div>;
    }
}
