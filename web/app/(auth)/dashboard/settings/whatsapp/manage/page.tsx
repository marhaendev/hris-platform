'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Smartphone, Globe, Users, CheckCircle2, XCircle,
    Loader2, Save, Trash2, ArrowLeft, MoreVertical, RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Company {
    id: number;
    name: string;
}

interface Bot {
    id: string;
    status: string;
    phone: string;
    dbName: string | null;
    isGlobal: boolean;
    usageCount: number;
    companies: Company[];
}

export default function BotManagementPage() {
    const user = useUser();
    const router = useRouter();
    const [bots, setBots] = useState<Bot[]>([]);
    const [allCompanies, setAllCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    // Assignment State
    const [editingBot, setEditingBot] = useState<Bot | null>(null);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);

    const fetchBots = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/bot/manage');
            if (res.ok) {
                const data = await res.json();
                setBots(data.bots || []);
                setAllCompanies(data.allCompanies || []);
            }
        } catch (e) {
            toast.error("Gagal mengambil data bot");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role !== 'SUPERADMIN') {
            router.push('/dashboard');
            return;
        }
        fetchBots();
    }, [user, router]);

    const handleUpdateBot = async (bot: Bot, updates: { name?: string; isGlobal?: boolean }) => {
        setIsSaving(bot.id);
        try {
            const res = await fetch('/api/bot/manage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: bot.id,
                    name: updates.name ?? bot.dbName,
                    isGlobal: updates.isGlobal ?? bot.isGlobal
                })
            });

            if (res.ok) {
                toast.success("Bot diperbarui");
                fetchBots();
            } else {
                toast.error("Gagal memperbarui bot");
            }
        } catch (e) {
            toast.error("Error connection");
        } finally {
            setIsSaving(null);
        }
    };

    const handleAssignCompanies = async () => {
        if (!editingBot) return;
        setIsAssigning(true);
        try {
            const res = await fetch('/api/bot/manage/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: editingBot.id,
                    companyIds: selectedCompanyIds
                })
            });

            if (res.ok) {
                toast.success("Assignment diperbarui");
                setEditingBot(null);
                fetchBots();
            } else {
                toast.error("Gagal memperbarui assignment");
            }
        } catch (e) {
            toast.error("Error connection");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleDeleteMetadata = async (sessionId: string) => {
        if (!confirm("Hapus metadata bot ini? Data di database akan dihapus, tapi sesi bot asli tetap ada.")) return;

        try {
            const res = await fetch(`/api/bot/manage?sessionId=${sessionId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Metadata dihapus");
                fetchBots();
            }
        } catch (e) {
            toast.error("Gagal menghapus");
        }
    };

    if (isLoading && bots.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 pl-0 hover:bg-transparent"
                        onClick={() => router.push('/dashboard/settings/whatsapp')}
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Pengaturan
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Bot WhatsApp Sistem</h2>
                    <p className="text-slate-500 text-sm">Kelola semua sesi bot yang aktif dan atur ketersediaan sistem untuk perusahaan.</p>
                </div>
                <Button onClick={fetchBots} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Segarkan
                </Button>
            </div>

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary" /> Semua Sesi Bot
                    </CardTitle>
                    <CardDescription>
                        Total {bots.length} bot terdeteksi di server.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[200px]">Info Bot</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Nama Label</TableHead>
                                <TableHead className="text-center">Sistem?</TableHead>
                                <TableHead>Penggunaan</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bots.map((bot) => (
                                <TableRow key={bot.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="font-bold text-slate-900">+{bot.phone}</div>
                                        <div className="text-[10px] text-slate-400 font-mono truncate w-32">{bot.id}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={bot.status === 'connected' ? 'default' : 'secondary'}
                                            className={bot.status === 'connected' ? 'bg-emerald-500' : ''}>
                                            {bot.status.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                className="h-8 max-w-[150px] text-xs"
                                                defaultValue={bot.dbName || ''}
                                                onBlur={(e) => {
                                                    if (e.target.value !== bot.dbName) {
                                                        handleUpdateBot(bot, { name: e.target.value });
                                                    }
                                                }}
                                                placeholder="Beri nama..."
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Switch
                                            checked={bot.isGlobal}
                                            onCheckedChange={(val) => handleUpdateBot(bot, { isGlobal: val })}
                                            disabled={isSaving === bot.id}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-3 w-3 text-slate-400" />
                                            <span className="text-sm font-medium">{bot.usageCount} Perusahaan</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 text-[10px] px-2"
                                                onClick={() => {
                                                    setEditingBot(bot);
                                                    setSelectedCompanyIds(bot.companies.map(c => c.id));
                                                }}
                                            >
                                                Pilih Perusahaan
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Opsi</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleUpdateBot(bot, {})}>
                                                    <Save className="mr-2 h-4 w-4" /> Simpan Metadata
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => handleDeleteMetadata(bot.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus dari Database
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {bots.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500 text-sm italic">
                                        Tidak ada bot yang terdaftar atau aktif.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Assignment Dialog */}
            <Dialog open={!!editingBot} onOpenChange={(open) => !open && setEditingBot(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Atur Penggunaan Perusahaan</DialogTitle>
                        <DialogDescription>
                            Pilih perusahaan mana saja yang akan menggunakan bot <span className="font-bold">+{editingBot?.phone}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {allCompanies.map((company) => (
                            <div key={company.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                <Checkbox
                                    id={`company-${company.id}`}
                                    checked={selectedCompanyIds.includes(company.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedCompanyIds([...selectedCompanyIds, company.id]);
                                        } else {
                                            setSelectedCompanyIds(selectedCompanyIds.filter(id => id !== company.id));
                                        }
                                    }}
                                />
                                <label
                                    htmlFor={`company-${company.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                >
                                    {company.name}
                                </label>
                            </div>
                        ))}
                        {allCompanies.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-xs italic">
                                Tidak ada data perusahaan.
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setEditingBot(null)}>Batal</Button>
                        <Button onClick={handleAssignCompanies} disabled={isAssigning} className="gap-2">
                            {isAssigning && <Loader2 className="h-4 w-4 animate-spin" />}
                            Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
