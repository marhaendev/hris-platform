'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, TrendingUp } from "lucide-react";

export default function BillingPage() {
    const [stats, setStats] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/admin/billing')
            .then(res => res.json())
            .then(data => {
                setStats(data.stats);
                setInvoices(data.recentInvoices);
            });
    }, []);

    if (!stats) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold font-headline text-slate-800 tracking-tight">Billing & Pembayaran</h1>
                <p className="text-slate-500 font-medium">Laporan pendapatan dan status tagihan.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total MRR</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-headline">Rp {stats.mrr.toLocaleString()}</div>
                        <p className="text-xs text-emerald-500 font-bold flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" /> +12% dari bulan lalu
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Langganan Aktif</CardTitle>
                        <CreditCard className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-headline">{stats.activeSubs} <span className="text-sm text-slate-400 font-normal">Perusahaan</span></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Tagihan Belum Lunas</CardTitle>
                        <DollarSign className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-headline text-red-600">{stats.unpaid}</div>
                        <p className="text-xs text-slate-400 mt-1">Perlu tindak lanjut</p>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Riwayat Transaksi Terakhir</h3>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="text-slate-500 bg-slate-50 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">ID Invoice</th>
                            <th className="px-6 py-3">Perusahaan</th>
                            <th className="px-6 py-3">Jumlah</th>
                            <th className="px-6 py-3">Tanggal</th>
                            <th className="px-6 py-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono font-medium text-slate-600">{inv.id}</td>
                                <td className="px-6 py-4 font-bold text-slate-700">{inv.company}</td>
                                <td className="px-6 py-4">Rp {inv.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                        {inv.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
