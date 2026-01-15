
import { Check, X, ShieldCheck, HelpCircle } from "lucide-react";
import { PublicNavbar } from "@/components/public-navbar";
import { PublicFooter } from "@/components/public-footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ComparePage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <PublicNavbar />

            {/* Header Section with Grid */}
            <div className="relative pt-32 pb-12 overflow-hidden">
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_90%,transparent_100%)]"></div>

                    {/* Bold Gradient Blobs - Matches Hero */}
                    <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-primary/10 via-cyan-500/5 to-transparent"></div>
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/30 blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[0%] -right-[10%] w-[40%] h-[60%] rounded-full bg-cyan-400/20 blur-[80px] animate-pulse delay-1000"></div>
                </div>

                <div className="container mx-auto px-4 max-w-7xl relative z-10">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Perbandingan Paket</h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Detail lengkap fitur yang Anda dapatkan di setiap paket. Transparan tanpa biaya tersembunyi.
                        </p>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border shadow-xl bg-white">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="border-b bg-slate-50">
                                    <th className="p-6 text-left w-1/4 sticky left-0 bg-slate-50 z-10 border-r">Fitur</th>
                                    <th className="p-6 text-center w-1/6">
                                        <div className="font-bold text-xl text-slate-900">Starter</div>
                                        <div className="text-sm text-slate-500 font-normal">Gratis</div>
                                    </th>
                                    <th className="p-6 text-center w-1/6 bg-blue-50/50">
                                        <div className="font-bold text-xl text-blue-700">Growth</div>
                                        <div className="text-sm text-blue-600 font-normal">Rp 999.000</div>
                                    </th>
                                    <th className="p-6 text-center w-1/6 bg-slate-900 text-white relative">
                                        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">POPULAR</div>
                                        <div className="font-bold text-xl">Pro</div>
                                        <div className="text-sm text-slate-400 font-normal">Rp 2.499.000</div>
                                    </th>
                                    <th className="p-6 text-center w-1/6">
                                        <div className="font-bold text-xl text-slate-900">Enterprise</div>
                                        <div className="text-sm text-slate-500 font-normal">Hubungi Kami</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {/* Section: Core HR */}
                                <tr className="bg-slate-100">
                                    <td colSpan={5} className="p-3 px-6 font-bold text-slate-700 text-sm uppercase tracking-wider sticky left-0 bg-slate-100 z-10">Core HR</td>
                                </tr>
                                <FeatureRow name="Database Karyawan" starter="5" growth="50" pro="200" ent="Unlimited" />
                                <FeatureRow name="Manajemen Kontrak Kerja" starter={true} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Struktur Organisasi" starter={true} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Resign & Offboarding" starter={false} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Arsip Dokumen Digital" starter="50 MB" growth="5 GB" pro="20 GB" ent="Unlimited" />

                                {/* Section: Absensi */}
                                <tr className="bg-slate-100">
                                    <td colSpan={5} className="p-3 px-6 font-bold text-slate-700 text-sm uppercase tracking-wider sticky left-0 bg-slate-100 z-10">Absensi & Waktu</td>
                                </tr>
                                <FeatureRow name="Absensi Mobile (GPS)" starter={true} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Absensi Wajah (Face Rec)" starter={true} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Anti Fake GPS" starter={true} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Manajemen Shift" starter={false} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Lembur Otomatis" starter={false} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Pengajuan Cuti Online" starter={true} growth={true} pro={true} ent={true} />

                                {/* Section: Payroll */}
                                <tr className="bg-slate-100">
                                    <td colSpan={5} className="p-3 px-6 font-bold text-slate-700 text-sm uppercase tracking-wider sticky left-0 bg-slate-100 z-10">Payroll & Finance</td>
                                </tr>
                                <FeatureRow name="Hitung Gaji Otomatis" starter="Basic" growth="Advanced" pro="Advanced" ent="Custom" />
                                <FeatureRow name="Hitung PPh 21 (Net/Gross)" starter={false} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Hitung BPJS Ketenagakerjaan" starter={false} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Slip Gaji Digital (PDF)" starter={true} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Kirim Slip via WhatsApp" starter={false} growth={false} pro={true} ent={true} />
                                <FeatureRow name="THR & Bonus" starter={false} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Reimbursement" starter={false} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Kasbon Karyawan" starter={false} growth={true} pro={true} ent={true} />

                                {/* Section: Reporting */}
                                <tr className="bg-slate-100">
                                    <td colSpan={5} className="p-3 px-6 font-bold text-slate-700 text-sm uppercase tracking-wider sticky left-0 bg-slate-100 z-10">Laporan & Analisa</td>
                                </tr>
                                <FeatureRow name="Laporan Kehadiran Bulanan" starter={true} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Laporan Gaji" starter="Summary" growth="Detail" pro="Detail" ent="Custom" />
                                <FeatureRow name="Export Laporan (Excel/PDF)" starter={false} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Analisa Turnover" starter={false} growth={false} pro={true} ent={true} />

                                {/* Section: Recruitment */}
                                <tr className="bg-slate-100">
                                    <td colSpan={5} className="p-3 px-6 font-bold text-slate-700 text-sm uppercase tracking-wider sticky left-0 bg-slate-100 z-10">Rekrutmen (ATS)</td>
                                </tr>
                                <FeatureRow name="Lowongan Kerja Aktif" starter="1 Lowongan" growth="5 Lowongan" pro="Unlimited" ent="Unlimited" />
                                <FeatureRow name="Terima Lamaran Online" starter={true} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Pipeline Pelamar (Kanban)" starter={false} growth={true} pro={true} ent={true} />
                                <FeatureRow name="Jadwal Interview" starter={false} growth={true} pro={true} ent={true} />

                                {/* Section: Teknis */}
                                <tr className="bg-slate-100">
                                    <td colSpan={5} className="p-3 px-6 font-bold text-slate-700 text-sm uppercase tracking-wider sticky left-0 bg-slate-100 z-10">Teknis & Support</td>
                                </tr>
                                <FeatureRow name="Support Level" starter="Komunitas" growth="Email (24 Jam)" pro="Prioritas (WA/Call)" ent="Dedicated Manager" />
                                <FeatureRow name="Custom Domain" starter={false} growth={false} pro={true} ent={true} />
                                <FeatureRow name="API Access" starter={false} growth={false} pro={false} ent={true} />
                                <FeatureRow name="White Label (Logo Sendiri)" starter={false} growth={false} pro={false} ent={true} />
                                <FeatureRow name="Source Code" starter={false} growth={false} pro={false} ent={true} />
                                <FeatureRow name="Install di Server Sendiri" starter={false} growth={false} pro={false} ent={true} />
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50 border-t">
                                    <td className="p-6 sticky left-0 bg-slate-50 z-10"></td>
                                    <td className="p-6 text-center">
                                        <Link href="/register">
                                            <Button variant="outline" className="w-full">Daftar Free</Button>
                                        </Link>
                                    </td>
                                    <td className="p-6 text-center bg-blue-50/50">
                                        <Link href="/register?plan=growth">
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Pilih Growth</Button>
                                        </Link>
                                    </td>
                                    <td className="p-6 text-center bg-slate-900">
                                        <Link href="/register?plan=pro">
                                            <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-lg">Pilih Pro</Button>
                                        </Link>
                                    </td>
                                    <td className="p-6 text-center">
                                        <Link href="https://wa.me/6281234567890">
                                            <Button variant="ghost" className="w-full hover:bg-slate-200">Kontak Sales</Button>
                                        </Link>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            <PublicFooter />
        </div>
    );
}

function FeatureRow({ name, starter, growth, pro, ent }: { name: string, starter: boolean | string, growth: boolean | string, pro: boolean | string, ent: boolean | string }) {
    const renderCell = (val: boolean | string, isPro: boolean = false) => {
        if (typeof val === 'boolean') {
            return val ? (
                <div className="flex justify-center">
                    <div className="bg-green-100 p-1 rounded-full">
                        <Check className="h-5 w-5 text-green-600" />
                    </div>
                </div>
            ) : (
                <div className="flex justify-center">
                    <div className="bg-slate-100 p-1 rounded-full">
                        <X className="h-5 w-5 text-slate-400" />
                    </div>
                </div>
            );
        }
        return <span className={`font-semibold ${isPro ? 'text-white' : 'text-slate-900'}`}>{val}</span>;
    };

    return (
        <tr className="hover:bg-slate-50 transition">
            <td className="p-4 px-6 text-slate-700 font-medium border-r bg-white sticky left-0 z-0">{name}</td>
            <td className="p-4 text-center border-r text-sm">{renderCell(starter)}</td>
            <td className="p-4 text-center border-r bg-blue-50/30 text-sm">{renderCell(growth)}</td>
            <td className="p-4 text-center border-r bg-slate-900 text-slate-200 text-sm">{renderCell(pro, true)}</td>
            <td className="p-4 text-center text-sm">{renderCell(ent)}</td>
        </tr>
    );
}
