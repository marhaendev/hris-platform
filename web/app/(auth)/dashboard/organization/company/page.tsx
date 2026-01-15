'use client';

import { useState, useEffect } from 'react';
import { useUser } from "@/app/(auth)/DashboardClientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Search, Trash2, Edit, Plus, CheckCircle2, XCircle, MoreVertical, MapPin, Phone, Globe, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { AboutConfigEditor } from '@/components/AboutConfigEditor';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Layers } from "lucide-react";

export default function CompaniesPage() {
    const { t } = useLanguage();
    const { refreshCompany } = useUser();
    const [companies, setCompanies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [userSession, setUserSession] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        companyName: '',
        ownerName: '',
        ownerEmail: '',
        password: '',
        subscriptionPlan: 'FREE',
        address: '',
        phone: '',
        whatsapp: '',
        email: '',
        website: '',
        about_config: null
    });

    const [editData, setEditData] = useState<any>({
        id: null,
        name: '',
        subscription_plan: 'FREE',
        address: '',
        phone: '',
        whatsapp: '',
        email: '',
        website: '',
        about_config: null
    });

    const fetchSession = async () => {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
            const data = await res.json();
            setUserSession(data);
        }
    };

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/organization/company?q=${searchTerm}&all=true`);
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSession();
        fetchCompanies();
    }, [searchTerm]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/organization/company', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            toast.success(t.organization.company.toast.createSuccess);
            setIsAddOpen(false);
            setFormData({
                companyName: '', ownerName: '', ownerEmail: '', password: '',
                subscriptionPlan: 'FREE', address: '', phone: '', whatsapp: '',
                email: '', website: '', about_config: null
            });
            fetchCompanies();
        } else {
            const data = await res.json();
            toast.error(data.error || t.organization.company.toast.createFailed);
        }
    };

    const handleUpdate = async (e?: React.FormEvent, customData?: any) => {
        if (e) e.preventDefault();
        const dataToUpdate = customData || editData;
        const res = await fetch('/api/organization/company', {
            method: 'PUT',
            body: JSON.stringify(dataToUpdate)
        });
        if (res.ok) {
            toast.success(t.organization.company.toast.updateSuccess);
            if (!customData) setIsEditOpen(false);
            fetchCompanies();
            refreshCompany?.();
        } else {
            const data = await res.json();
            toast.error(data.error || t.organization.company.toast.updateFailed);
        }
    };

    const handleDelete = async (id: number) => {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        const res = await fetch(`/api/organization/company?id=${deleteTargetId}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            toast.success(t.organization.company.toast.deleteSuccess);
            setDeleteConfirmOpen(false);
            fetchCompanies();
        } else {
            const data = await res.json();
            toast.error(data.error || t.organization.company.toast.deleteFailed);
        }
    };

    const [generateTargetId, setGenerateTargetId] = useState<number | null>(null);
    const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);

    const handleGenerateDepartments = async (type: 'STANDARD' | 'FULL') => {
        if (!generateTargetId) return;

        const loadingToast = toast.loading("Generating departments...");
        try {
            const res = await fetch('/api/organization/department/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId: generateTargetId, type })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Success! Created: ${data.stats.created}, Skipped: ${data.stats.skipped}`, {
                    id: loadingToast
                });
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to generate", { id: loadingToast });
            }
        } catch (e) {
            toast.error("An error occurred", { id: loadingToast });
        } finally {
            setGenerateConfirmOpen(false);
            setGenerateTargetId(null);
        }
    };

    const isSuperadmin = userSession?.role === 'SUPERADMIN';

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-slate-800 tracking-tight">{t.organization.company.title}</h1>
                    <p className="text-slate-500 font-medium">
                        {isSuperadmin ? t.organization.company.subtitleSuper : t.organization.company.subtitleOwner}
                    </p>
                </div>

                {isSuperadmin && (
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20">
                                <Plus className="h-5 w-5 mr-2" /> {t.organization.company.add}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t.organization.company.form.titleNew}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>{t.organization.company.form.name}</Label>
                                    <Input required value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} placeholder={t.organization.company.form.namePlaceholder} />
                                </div>



                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t.organization.company.form.plan}</Label>
                                        <Select value={formData.subscriptionPlan} onValueChange={v => setFormData({ ...formData, subscriptionPlan: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FREE">Free</SelectItem>
                                                <SelectItem value="PRO">Pro</SelectItem>
                                                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t.organization.company.form.ownerPassword}</Label>
                                        <Input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="******" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.organization.company.form.ownerName}</Label>
                                    <Input required value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} placeholder="Budi Santoso" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.organization.company.form.ownerEmail}</Label>
                                    <Input required type="email" value={formData.ownerEmail} onChange={e => setFormData({ ...formData, ownerEmail: e.target.value })} placeholder="budi@maju.com" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-500">Email Admin (Otomatis)</Label>
                                    <Input
                                        disabled
                                        value={formData.ownerEmail.includes('@') ? `admin@${formData.ownerEmail.split('@')[1]}` : ''}
                                        placeholder="admin@domain.com"
                                        className="bg-slate-50 text-slate-500 border-dashed"
                                    />
                                    <p className="text-[11px] text-blue-600 bg-blue-50/50 p-2 rounded border border-blue-100 flex items-start gap-2">
                                        <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                                        <span>Akun Admin akan otomatis dibuat dengan email ini dan password sama dengan Owner.</span>
                                    </p>
                                </div>
                                <Button type="submit" className="w-full font-bold">{t.common.save}</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Edit Dialog with Tabs */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t.organization.company.form.titleEdit}</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="info" className="w-full mt-4">
                        <TabsList className={`grid w-full ${isSuperadmin ? 'grid-cols-4' : 'grid-cols-2'}`}>
                            <TabsTrigger value="info">{t.organization.company.form.tabs.info}</TabsTrigger>
                            <TabsTrigger value="contact">{t.organization.company.form.tabs.contact}</TabsTrigger>
                            {isSuperadmin && <TabsTrigger value="about">Tentang</TabsTrigger>}
                            {isSuperadmin && <TabsTrigger value="billing">{t.organization.company.form.tabs.billing}</TabsTrigger>}
                        </TabsList>

                        <form onSubmit={handleUpdate}>
                            <TabsContent value="info" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>{t.organization.company.form.name}</Label>
                                    <Input required value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} placeholder={t.organization.company.form.namePlaceholder} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.organization.company.form.address}</Label>
                                    <Textarea value={editData.address || ''} onChange={e => setEditData({ ...editData, address: e.target.value })} placeholder={t.organization.company.form.addressPlaceholder} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.organization.company.form.website}</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input className="pl-10" value={editData.website || ''} onChange={e => setEditData({ ...editData, website: e.target.value })} placeholder={t.organization.company.form.websitePlaceholder} />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="contact" className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{t.organization.company.form.phone}</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input className="pl-10" value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} placeholder={t.organization.company.form.phonePlaceholder} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t.organization.company.form.whatsapp}</Label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 font-bold">W</div>
                                            <Input className="pl-10" value={editData.whatsapp || ''} onChange={e => setEditData({ ...editData, whatsapp: e.target.value })} placeholder={t.organization.company.form.whatsappPlaceholder} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.organization.company.form.email}</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input className="pl-10" type="email" value={editData.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })} placeholder={t.organization.company.form.emailPlaceholder} />
                                    </div>
                                </div>
                            </TabsContent>

                            {isSuperadmin && (
                                <TabsContent value="about" className="space-y-4 pt-4">
                                    <AboutConfigEditor
                                        initialValue={editData.about_config}
                                        onSave={(val) => {
                                            const updated = { ...editData, about_config: val };
                                            setEditData(updated);
                                            handleUpdate(undefined, updated);
                                        }}
                                    />
                                </TabsContent>
                            )}

                            {isSuperadmin && (
                                <TabsContent value="billing" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>{t.organization.company.form.plan}</Label>
                                        <Select value={editData.subscription_plan} onValueChange={v => setEditData({ ...editData, subscription_plan: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FREE">Free</SelectItem>
                                                <SelectItem value="PRO">Pro</SelectItem>
                                                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-slate-400 mt-2 italic">{t.organization.company.form.billingHint}</p>
                                    </div>
                                </TabsContent>
                            )}

                            <div className="mt-6 pt-4 border-t flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>{t.common.cancel}</Button>
                                <Button type="submit" className="font-bold">{t.common.save}</Button>
                            </div>
                        </form>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Search - only for superadmin */}
            {isSuperadmin && (
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder={t.organization.company.searchPlaceholder}
                        className="pl-10 h-12 rounded-xl border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">{t.organization.company.table.name}</th>
                            <th className="px-6 py-4">{t.organization.company.table.owner}</th>
                            <th className="px-6 py-4">{t.organization.company.table.contact}</th>
                            <th className="px-6 py-4">{t.organization.company.table.totalEmployee}</th>
                            {isSuperadmin && <th className="px-6 py-4">{t.organization.company.table.plan}</th>}
                            <th className="px-6 py-4 text-right">{t.organization.company.table.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={isSuperadmin ? 6 : 5} className="px-6 py-8 text-center text-slate-400">{t.common.loading}</td></tr>
                        ) : companies.length === 0 ? (
                            <tr><td colSpan={isSuperadmin ? 6 : 5} className="px-6 py-8 text-center text-slate-400">{t.common.noData}</td></tr>
                        ) : (
                            companies.map((comp) => (
                                <tr key={comp.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p>{comp.name}</p>
                                                {comp.address && <p className="text-[10px] text-slate-400 font-normal truncate max-w-[200px] flex items-center gap-1 mt-1"><MapPin className="h-2 w-2" /> {comp.address}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-slate-800">{comp.ownerName || '-'}</p>
                                        <p className="text-xs text-slate-400">{comp.ownerEmail || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {comp.phone && <p className="text-xs text-slate-600 flex items-center gap-1"><Phone className="h-3 w-3" /> {comp.phone}</p>}
                                        {comp.email && <p className="text-xs text-slate-400 flex items-center gap-1"><Mail className="h-3 w-3" /> {comp.email}</p>}
                                        {!comp.phone && !comp.email && <span className="text-slate-300">-</span>}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-medium text-slate-600 text-center">
                                        {comp.employeeCount || 0}
                                    </td>
                                    {isSuperadmin && (
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${comp.subscription_plan === 'ENTERPRISE' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                comp.subscription_plan === 'PRO' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>
                                                {comp.subscription_plan}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setEditData({
                                                            id: comp.id,
                                                            name: comp.name,
                                                            subscription_plan: comp.subscription_plan || 'FREE',
                                                            address: comp.address || '',
                                                            phone: comp.phone || '',
                                                            whatsapp: comp.whatsapp || '',
                                                            email: comp.email || '',
                                                            website: comp.website || '',
                                                            about_config: comp.about_config || null
                                                        });
                                                        setIsEditOpen(true);
                                                    }}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    {t.common.edit}
                                                </DropdownMenuItem>

                                                {isSuperadmin && (
                                                    <>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setGenerateTargetId(comp.id);
                                                                setGenerateConfirmOpen(true);
                                                            }}
                                                        >
                                                            <Layers className="mr-2 h-4 w-4" />
                                                            Generate Departments
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(comp.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            {t.common.delete}
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={t.organization.company.dialog.deleteTitle}
                description={t.organization.company.dialog.deleteDesc}
                confirmText={t.organization.company.dialog.deleteConfirm}
                variant="danger"
                onConfirm={confirmDelete}
            />

            <Dialog open={generateConfirmOpen} onOpenChange={setGenerateConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate Default Departments</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-slate-600">
                            Pilih jenis template yang ingin di-generate untuk perusahaan ini.
                            <br />
                            <span className="text-xs text-slate-400 italic">
                                Note: Departemen yang sudah ada dengan nama yang sama akan di-skip (tidak duplikat).
                            </span>
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-slate-50 border-2 hover:border-primary/20" onClick={() => handleGenerateDepartments('STANDARD')}>
                                <span className="font-bold text-lg text-primary">Standard</span>
                                <span className="text-xs font-normal text-slate-500 text-center">~8 Departemen Utama<br />(HR, Finance, IT, etc)</span>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-slate-50 border-2 hover:border-primary/20" onClick={() => handleGenerateDepartments('FULL')}>
                                <span className="font-bold text-lg text-primary">Full Set</span>
                                <span className="text-xs font-normal text-slate-500 text-center">~270+ Departemen Lengkap<br />(Semua Variasi)</span>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
