'use client';

import React, { useState, useEffect } from 'react';
import {
    FlaskConical,
    Send,
    Copy,
    Check,
    Code2,
    Info,
    Terminal,
    Globe,
    Shield,
    Database,
    Smartphone,
    Users,
    ChevronRight,
    Search,
    Play,
    Trash2,
    RefreshCw,
    Split,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Building2,
    Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiScenario {
    id: string;
    name: string;
    description: string;
    body?: any;
    responseExample: any;
    isError?: boolean;
}

interface ApiEndpoint {
    id: string;
    path: string;
    method: HttpMethod;
    title: string;
    description: string;
    auth: 'Superadmin' | 'Admin' | 'Any Authenticated';
    params?: { name: string; type: string; required: boolean; description: string }[];
    scenarios: ApiScenario[];
}

const ENDPOINTS: Record<string, ApiEndpoint[]> = {
    'karyawan': [
        {
            id: 'emp-list',
            path: '/api/employees',
            method: 'GET',
            title: 'List Karyawan',
            description: 'Mengambil semua data karyawan untuk perusahaan (PT Sinar).',
            auth: 'Admin',
            scenarios: [
                {
                    id: 'list-success',
                    name: 'Sukses (Real)',
                    description: 'Melihat daftar karyawan aktif di perusahaan.',
                    responseExample: [
                        {
                            "id": 12,
                            "position": "Senior Developer",
                            "department": "Information Technology",
                            "user": { "name": "Budi Santoso", "email": "budi@sinar.com" }
                        }
                    ]
                }
            ]
        },
        {
            id: 'emp-create',
            path: '/api/employees',
            method: 'POST',
            title: 'Tambah Karyawan',
            description: 'Memasukkan data karyawan baru ke PT Sinar.',
            auth: 'Admin',
            scenarios: [
                {
                    id: 'create-success',
                    name: 'Sukses (IT Dept)',
                    description: 'Menambah karyawan ke Dept Information Technology (ID: 77243).',
                    body: {
                        name: "Eko Prasetyo",
                        email: "eko.pos@sinar.com",
                        password: "Password123#",
                        position: "Developer",
                        baseSalary: 12000000,
                        departmentId: 77243,
                        positionId: 4103, // Senior Dev in IT
                        phone: "628991234567"
                    },
                    responseExample: { success: true, id: 105, message: "Karyawan berhasil ditambahkan" }
                },
                {
                    id: 'create-fail-dept',
                    name: 'Gagal (Dept Invalid)',
                    description: 'Menggunakan Department ID yang tidak ada.',
                    isError: true,
                    body: { name: "Test User", email: "test@fail.com", departmentId: 999999 },
                    responseExample: { error: "Department not found" }
                }
            ]
        },
        {
            id: 'emp-generate',
            path: '/api/employees/generate',
            method: 'POST',
            title: 'Generate Dummy',
            description: 'Membuat data karyawan tiruan massal.',
            auth: 'Superadmin',
            scenarios: [
                {
                    id: 'gen-5',
                    name: 'Generate 5 Data',
                    description: 'Membuat 5 data karyawan secara otomatis.',
                    body: { count: 5, preset: "Standard" },
                    responseExample: { success: true, count: 5, message: "5 dummy employees generated" }
                }
            ]
        }
    ],
    'whatsapp': [
        {
            id: 'wa-status',
            path: '/api/settings/whatsapp',
            method: 'GET',
            title: 'Status Link WA',
            description: 'Mengecek ID sesi WhatsApp PT Sinar.',
            auth: 'Admin',
            scenarios: [
                {
                    id: 'wa-success',
                    name: 'Sesi Aktif',
                    description: 'Perusahaan memiliki sesi "sinar-session-demo".',
                    responseExample: { sessionId: "sinar-session-demo", linkedAt: "2024-01-15T00:00:00Z" }
                }
            ]
        },
        {
            id: 'wa-send',
            path: '/api/bot/send',
            method: 'POST',
            title: 'Kirim Pesan WA',
            description: 'Mengirimkan pesan via bot PT Sinar.',
            auth: 'Admin',
            scenarios: [
                {
                    id: 'send-text',
                    name: 'Kirim OTP Demo',
                    description: 'Simulasi pengiriman pesan teks.',
                    body: { sessionId: "sinar-session-demo", to: "6281234567890", text: "KODE OTP ANDA: 1234. Jangan berikan kode ini kepada siapapun." },
                    responseExample: { success: true, message: "Message sent", messageId: "3EB04..." }
                },
                {
                    id: 'send-fail-session',
                    name: 'Gagal Sesi Salah',
                    description: 'Mengirim dengan ID sesi yang salah.',
                    isError: true,
                    body: { sessionId: "wrong-session", to: "6281234567890", text: "Hello" },
                    responseExample: { error: "Session not found" }
                }
            ]
        }
    ],
    'organisasi': [
        {
            id: 'org-dept',
            path: '/api/organization/department',
            method: 'GET',
            title: 'List Departemen',
            description: 'Mengambil daftar departemen PT Sinar.',
            auth: 'Admin',
            scenarios: [
                {
                    id: 'dept-list',
                    name: 'Semua Dept',
                    description: 'Daftar Finance, IT, Operations, dll.',
                    responseExample: [
                        { "id": 77240, "name": "Finance" },
                        { "id": 77243, "name": "Information Technology" }
                    ]
                }
            ]
        }
    ],
    'absensi': [
        {
            id: 'att-checkin',
            path: '/api/attendance',
            method: 'POST',
            title: 'Simulasi Check-In',
            description: 'Melakukan absen masuk (bisa On Time atau Terlambat bergantung jam sim).',
            auth: 'Any Authenticated',
            scenarios: [
                {
                    id: 'checkin-hq',
                    name: 'Check-In Kantor Pusat',
                    description: 'Absen di lokasi valid (-6.2088, 106.8456).',
                    body: { latitude: -6.2088, longitude: 106.8456, address: "Kantor Pusat Mock" },
                    responseExample: { success: true }
                },
                {
                    id: 'checkin-remote',
                    name: 'Check-In Luar Radius',
                    description: 'Absen di lokasi jauh (test validasi radius).',
                    isError: true,
                    body: { latitude: -6.5000, longitude: 107.0000, address: "Home" },
                    responseExample: { error: "Anda berada di luar radius absensi" }
                }
            ]
        },
        {
            id: 'att-checkout',
            path: '/api/attendance',
            method: 'PUT',
            title: 'Simulasi Check-Out',
            description: 'Melakukan absen pulang manual.',
            auth: 'Any Authenticated',
            scenarios: [
                {
                    id: 'checkout-manual',
                    name: 'Pulang Normal',
                    description: 'Check-out manual dengan ID kehadiran.',
                    body: { id: 105 },
                    responseExample: { success: true }
                }
            ]
        }
    ],
    'cuti': [
        {
            id: 'leave-req',
            path: '/api/leave',
            method: 'POST',
            title: 'Pengajuan Cuti',
            description: 'Simulasi karyawan mengajukan cuti baru.',
            auth: 'Any Authenticated',
            scenarios: [
                {
                    id: 'leave-annual',
                    name: 'Cuti Tahunan (2 Hari)',
                    description: 'Mengurangi kuota cuti tahunan.',
                    body: {
                        type: "ANNUAL",
                        startDate: "2024-12-25",
                        endDate: "2024-12-26",
                        reason: "Liburan Keluarga"
                    },
                    responseExample: { success: true, id: 45 }
                },
                {
                    id: 'leave-sick',
                    name: 'Izin Sakit',
                    description: 'Mengajukan izin sakit (tidak potong kuota biasanya).',
                    body: {
                        type: "SICK",
                        startDate: "2024-11-10",
                        endDate: "2024-11-10",
                        reason: "Demam Tinggi"
                    },
                    responseExample: { success: true, id: 46 }
                }
            ]
        }
    ],
    'gaji': [
        {
            id: 'payroll-gen',
            path: '/api/payroll',
            method: 'POST',
            title: 'Generator Payroll',
            description: 'Menjalankan proses penggajian bulanan.',
            auth: 'Admin',
            scenarios: [
                {
                    id: 'run-payroll',
                    name: 'Run Payroll Jan 2026',
                    description: 'Generate slip gaji untuk periode Januari 2026.',
                    body: { month: 1, year: 2026 },
                    responseExample: { success: true, message: "Successfully generated 15 payroll records." }
                }
            ]
        }
    ]
};

export default function PlaygroundPage() {
    const [activeTab, setActiveTab] = useState('karyawan');
    const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
    const [selectedScenario, setSelectedScenario] = useState<ApiScenario | null>(null);
    const [requestBody, setRequestBody] = useState<string>('');
    const [apiResponse, setApiResponse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedEndpoint) {
            const firstScenario = selectedEndpoint.scenarios[0];
            setSelectedScenario(firstScenario);
            setRequestBody(firstScenario.body ? JSON.stringify(firstScenario.body, null, 2) : '');
            setApiResponse(null);
        }
    }, [selectedEndpoint]);

    useEffect(() => {
        if (selectedScenario) {
            setRequestBody(selectedScenario.body ? JSON.stringify(selectedScenario.body, null, 2) : '');
            setApiResponse(null);
        }
    }, [selectedScenario]);

    const runTest = async (endpoint: ApiEndpoint) => {
        setIsLoading(true);
        setApiResponse(null);
        try {
            const options: RequestInit = {
                method: endpoint.method,
                headers: { 'Content-Type': 'application/json' },
            };

            if (endpoint.method !== 'GET' && requestBody) {
                options.body = requestBody;
            }

            const res = await fetch(endpoint.path, options);
            const data = await res.json();
            setApiResponse(data);
        } catch (err: any) {
            setApiResponse({ error: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <FlaskConical className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-black tracking-tight">HR Process Simulation</h1>
                </div>
                <p className="text-slate-500 font-medium">Uji coba alur kerja sistem (Absensi, Cuti, Payroll) dalam lingkungan aman.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardContent className="p-3 flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                        <div>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase">Company Context</p>
                            <p className="text-xs font-black text-emerald-900">PT Sinar (ID: 8)</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-3 flex items-center gap-3">
                        <Users className="h-4 w-4 text-blue-600" />
                        <div>
                            <p className="text-[10px] text-blue-600 font-bold uppercase">Active Tester</p>
                            <p className="text-xs font-black text-blue-900">playground (Superadmin)</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="p-3 flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-slate-600" />
                        <div>
                            <p className="text-[10px] text-slate-600 font-bold uppercase">Real Dept IDs</p>
                            <p className="text-xs font-black text-slate-900">IT: 77243, Fin: 77240</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                    <CardContent className="p-3 flex items-center gap-3">
                        <Smartphone className="h-4 w-4 text-purple-600" />
                        <div>
                            <p className="text-[10px] text-purple-600 font-bold uppercase">Real WA Sesi</p>
                            <p className="text-xs font-black text-purple-900">sinar-session-demo</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-4 border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px] rounded-2xl">
                    <CardHeader className="bg-slate-50 border-b py-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input placeholder="Cari API..." className="pl-9 bg-white border-slate-200 h-9 text-xs" />
                        </div>
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto p-2">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full grid grid-cols-4 gap-1 h-auto bg-slate-100 p-1 rounded-xl mb-4">
                                <TabsTrigger value="absensi" className="text-[9px] uppercase font-black tracking-tighter py-2">Absensi</TabsTrigger>
                                <TabsTrigger value="cuti" className="text-[9px] uppercase font-black tracking-tighter py-2">Cuti</TabsTrigger>
                                <TabsTrigger value="gaji" className="text-[9px] uppercase font-black tracking-tighter py-2">Payroll</TabsTrigger>
                                <TabsTrigger value="karyawan" className="text-[9px] uppercase font-black tracking-tighter py-2">Staffing</TabsTrigger>
                            </TabsList>

                            {Object.entries(ENDPOINTS).map(([category, items]) => (
                                <TabsContent key={category} value={
                                    ['auth', 'master', 'organisasi', 'karyawan', 'whatsapp'].includes(category) ? 'karyawan' : category
                                }
                                    className="mt-0 space-y-1">
                                    <div className="px-2 py-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{category}</p>
                                    </div>
                                    {items.map((ep) => (
                                        <button
                                            key={ep.id}
                                            onClick={() => setSelectedEndpoint(ep)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                                                selectedEndpoint?.id === ep.id
                                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                                    : "hover:bg-slate-100 text-slate-700"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-6 w-10 flex items-center justify-center rounded-lg text-[8px] font-black tracking-tighter shrink-0",
                                                selectedEndpoint?.id === ep.id ? "bg-white/20" :
                                                    ep.method === 'GET' ? "bg-emerald-100 text-emerald-700" :
                                                        ep.method === 'POST' ? "bg-blue-100 text-blue-700" : "bg-slate-200"
                                            )}>
                                                {ep.method}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-xs font-bold truncate leading-tight">{ep.title}</p>
                                            </div>
                                        </button>
                                    ))}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </Card>

                <div className="lg:col-span-8 flex flex-col gap-6">
                    {!selectedEndpoint ? (
                        <Card className="flex flex-col items-center justify-center h-[700px] border-slate-200 border-dashed bg-slate-50/50 rounded-2xl">
                            <h3 className="text-lg font-bold text-slate-400 font-black uppercase tracking-widest">Pilih Endpoint</h3>
                        </Card>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <Split className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Pilih Skenario Simulasi</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {selectedEndpoint.scenarios.map((sc) => (
                                        <button
                                            key={sc.id}
                                            onClick={() => setSelectedScenario(sc)}
                                            className={cn(
                                                "flex flex-col gap-1 p-3 rounded-2xl border-2 transition-all text-left",
                                                selectedScenario?.id === sc.id
                                                    ? "bg-white border-primary shadow-sm"
                                                    : "bg-slate-50 border-transparent hover:border-slate-200"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={cn("text-[10px] font-black uppercase",
                                                    selectedScenario?.id === sc.id ? "text-primary" : "text-slate-500"
                                                )}>{sc.name}</span>
                                                {sc.isError ? <XCircle className="h-3 w-3 text-red-400" /> : <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                                            </div>
                                            <p className="text-[9px] text-slate-400 leading-tight">{sc.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-3">
                                    <Card className="border-slate-200 shadow-sm rounded-2xl flex-1 overflow-hidden h-[250px] flex flex-col">
                                        <div className="px-4 py-2 border-b bg-slate-50 flex justify-between items-center">
                                            <h4 className="text-[9px] font-black uppercase text-slate-500">Parameter Simulasi</h4>
                                            <Badge variant="outline" className="text-[8px] h-4">JSON</Badge>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            {selectedEndpoint.method === 'GET' ? (
                                                <div className="h-full flex items-center justify-center p-6 text-center text-slate-300">
                                                    <p className="text-xs font-medium italic">Metode GET (No Body)</p>
                                                </div>
                                            ) : (
                                                <textarea
                                                    value={requestBody}
                                                    onChange={(e) => setRequestBody(e.target.value)}
                                                    className="w-full h-full p-4 bg-white font-mono text-[10px] outline-none border-none resize-none text-slate-700 min-h-full"
                                                />
                                            )}
                                        </div>
                                    </Card>
                                    <Button
                                        onClick={() => runTest(selectedEndpoint)}
                                        disabled={isLoading}
                                        className="h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20"
                                    >
                                        {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                        Jalankan Simulasi
                                    </Button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Card className="border-slate-200 shadow-sm rounded-2xl bg-slate-900 flex-1 overflow-hidden h-[400px] flex flex-col border-white/5">
                                        <div className="px-4 py-2 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                            <h4 className="text-[9px] font-black uppercase text-white/40">Hasil Simulasi</h4>
                                        </div>
                                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                                            {!apiResponse ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                                                    <Terminal className="h-5 w-5 text-white/5" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/10 animate-pulse">API Runner Ready...</p>
                                                </div>
                                            ) : (
                                                <pre className={cn(
                                                    "text-[10px] font-mono leading-relaxed pb-6",
                                                    apiResponse.error ? "text-red-400" : "text-emerald-300"
                                                )}>
                                                    {JSON.stringify(apiResponse, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
