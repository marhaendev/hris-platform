'use client';

import React from 'react';
import {
    Printer,
    Download,
    X,
    Building2,
    User,
    Calendar,
    Briefcase,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';

interface PayslipProps {
    isOpen: boolean;
    onClose: () => void;
    payroll: any; // Using any for brevity in this example
}

export default function PayslipModal({ isOpen, onClose, payroll }: PayslipProps) {
    if (!payroll) return null;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric'
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl">
                <DialogHeader className="p-6 bg-slate-900 text-white flex flex-row justify-between items-center">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-400" />
                        Slip Gaji Karyawan
                    </DialogTitle>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Cetak
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="p-10 space-y-8 print:p-0" id="payslip-content">
                    {/* Company Header */}
                    <div className="flex justify-between items-start border-b pb-8 border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-100 p-3 rounded-2xl">
                                <Building2 className="h-10 w-10 text-slate-800" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 leading-tight">HRIS Solutions</h2>
                                <p className="text-sm text-slate-500 font-medium">Laporan Penghasilan Bulanan</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Periode Gaji</div>
                            <div className="text-xl font-black text-slate-900">{formatDate(payroll.period)}</div>
                        </div>
                    </div>

                    {/* Employee Info */}
                    <div className="grid grid-cols-2 gap-12 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Karyawan</span>
                                <span className="text-lg font-bold text-slate-900">{payroll.employee.name}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departemen</span>
                                <span className="text-md font-semibold text-slate-700">{payroll.employee.department}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jabatan</span>
                                <span className="text-lg font-bold text-slate-900">{payroll.employee.position}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Pajak</span>
                                <span className="text-md font-semibold text-slate-700">TK/0 (Default)</span>
                            </div>
                        </div>
                    </div>

                    {/* Details Table */}
                    <div className="grid grid-cols-2 gap-12">
                        {/* Earnings */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-3 border-emerald-100">
                                <span className="text-emerald-600 mr-2">●</span> Penghasilan
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600">Gaji Pokok</span>
                                    <span className="text-sm font-bold text-slate-900">{formatCurrency(payroll.baseSalary)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600">Tunjangan Lainnya</span>
                                    <span className="text-sm font-bold text-slate-900">{formatCurrency(payroll.allowances)}</span>
                                </div>
                                <div className="h-px bg-slate-100 my-2" />
                                <div className="flex justify-between items-center px-3">
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Total Bruto</span>
                                    <span className="text-sm font-black text-emerald-600">{formatCurrency(payroll.baseSalary + payroll.allowances)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-3 border-rose-100">
                                <span className="text-rose-600 mr-2">●</span> Potongan & Pajak
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-rose-50/50 p-3 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600">PPh21</span>
                                    <span className="text-sm font-bold text-rose-600">-{formatCurrency(payroll.pph21)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600">Potongan BPJS</span>
                                    <span className="text-sm font-bold text-rose-600">-{formatCurrency(payroll.deductions)}</span>
                                </div>
                                <div className="h-px bg-slate-100 my-2" />
                                <div className="flex justify-between items-center px-3">
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Total Potongan</span>
                                    <span className="text-sm font-black text-rose-600">-{formatCurrency(payroll.pph21 + payroll.deductions)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="mt-12 bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-3xl" />

                        <div className="relative flex flex-col items-center">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Gaji Bersih Diterima (Take Home Pay)</span>
                            <span className="text-5xl font-black tracking-tighter mb-2">{formatCurrency(payroll.netSalary)}</span>
                            <div className="flex items-center gap-2 mt-2 px-4 py-1.5 bg-white/10 rounded-full backdrop-blur-sm">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">Terverifikasi Sistem HRIS</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end pt-8 opacity-50 italic text-[10px] text-slate-400">
                        <p>Dokumen ini dihasilkan secara otomatis dan sah tanpa tanda tangan basah.</p>
                        <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                    </div>
                </div>
            </DialogContent>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #payslip-content, #payslip-content * {
                        visibility: visible;
                    }
                    #payslip-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </Dialog>
    );
}

// Adding missing icon from imports
import { FileText as FileTextIcon } from 'lucide-react';
const FileText = FileTextIcon;
