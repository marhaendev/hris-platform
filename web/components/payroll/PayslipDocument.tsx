import React from 'react';
import { Building2, ShieldCheck, FileText } from 'lucide-react';

interface PayslipDocumentProps {
    payroll: any;
    className?: string;
}

export const PayslipDocument = ({ payroll, className = '' }: PayslipDocumentProps) => {
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

    return (
        <div className={`p-5 print:p-10 space-y-4 print:space-y-8 bg-white ${className}`} id={`payslip-${payroll.id}`}>
            {/* Company Header */}
            <div className="flex justify-between items-start border-b pb-4 print:pb-8 border-slate-100">
                <div className="flex items-center gap-3 print:gap-4">
                    <div className="bg-slate-100 p-2 print:p-3 rounded-lg print:rounded-2xl print:bg-slate-100/50">
                        <Building2 className="h-6 w-6 print:h-10 print:w-10 text-slate-800" />
                    </div>
                    <div>
                        <h2 className="text-lg print:text-2xl font-black text-slate-900 leading-tight">HRIS Solutions</h2>
                        <p className="text-[10px] print:text-sm text-slate-500 font-medium">Laporan Penghasilan Bulanan</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[9px] print:text-sm font-bold text-slate-400 uppercase tracking-widest">Periode Gaji</div>
                    <div className="text-sm print:text-xl font-black text-slate-900">{formatDate(payroll.period)}</div>
                </div>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-4 print:gap-12 bg-slate-50 p-4 print:p-6 rounded-lg print:rounded-2xl border border-slate-100 print:bg-transparent print:border-slate-200">
                <div className="space-y-2 print:space-y-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] print:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Karyawan</span>
                        <span className="text-sm print:text-lg font-bold text-slate-900">{payroll.employee.name}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] print:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departemen</span>
                        <span className="text-xs print:text-md font-semibold text-slate-700">{payroll.employee.department}</span>
                    </div>
                </div>
                <div className="space-y-2 print:space-y-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] print:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jabatan</span>
                        <span className="text-sm print:text-lg font-bold text-slate-900">{payroll.employee.position}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] print:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Pajak</span>
                        <span className="text-xs print:text-md font-semibold text-slate-700">TK/0 (Default)</span>
                    </div>
                </div>
            </div>

            {/* Details Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-12">
                {/* Earnings */}
                <div className="space-y-3 print:space-y-6">
                    <h3 className="text-[9px] print:text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2 print:pb-3 border-emerald-100">
                        <span className="text-emerald-600 mr-2">●</span> Penghasilan
                    </h3>
                    <div className="space-y-1.5 print:space-y-3">
                        <div className="flex justify-between items-center bg-emerald-50/50 p-2 print:p-3 rounded-md print:rounded-xl print:bg-transparent print:border-b print:border-slate-100">
                            <span className="text-xs print:text-sm font-medium text-slate-600">Gaji Pokok</span>
                            <span className="text-xs print:text-sm font-bold text-slate-900">{formatCurrency(payroll.baseSalary)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 print:p-3 rounded-md print:rounded-xl print:border-b print:border-slate-100">
                            <span className="text-xs print:text-sm font-medium text-slate-600">Tunjangan Lainnya</span>
                            <span className="text-xs print:text-sm font-bold text-slate-900">{formatCurrency(payroll.allowances)}</span>
                        </div>
                        <div className="h-px bg-slate-100 my-1 print:my-2 print:hidden" />
                        <div className="flex justify-between items-center px-2 pt-1 print:px-3 print:pt-4">
                            <span className="text-[10px] print:text-sm font-black text-slate-900 uppercase tracking-wider">Total Bruto</span>
                            <span className="text-[10px] print:text-sm font-black text-emerald-600">{formatCurrency(payroll.baseSalary + payroll.allowances)}</span>
                        </div>
                    </div>
                </div>

                {/* Deductions */}
                <div className="space-y-3 print:space-y-6">
                    <h3 className="text-[9px] print:text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2 print:pb-3 border-rose-100">
                        <span className="text-rose-600 mr-2">●</span> Potongan & Pajak
                    </h3>
                    <div className="space-y-1.5 print:space-y-3">
                        <div className="flex justify-between items-center bg-rose-50/50 p-2 print:p-3 rounded-md print:rounded-xl print:bg-transparent print:border-b print:border-slate-100">
                            <span className="text-xs print:text-sm font-medium text-slate-600">PPh21</span>
                            <span className="text-xs print:text-sm font-bold text-rose-600">-{formatCurrency(payroll.pph21)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 print:p-3 rounded-md print:rounded-xl print:border-b print:border-slate-100">
                            <span className="text-xs print:text-sm font-medium text-slate-600">Potongan BPJS</span>
                            <span className="text-xs print:text-sm font-bold text-rose-600">-{formatCurrency(payroll.deductions)}</span>
                        </div>
                        <div className="h-px bg-slate-100 my-1 print:my-2 print:hidden" />
                        <div className="flex justify-between items-center px-2 pt-1 print:px-3 print:pt-4">
                            <span className="text-[10px] print:text-sm font-black text-slate-900 uppercase tracking-wider">Total Potongan</span>
                            <span className="text-[10px] print:text-sm font-black text-rose-600">-{formatCurrency(payroll.pph21 + payroll.deductions)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Card */}
            <div className="mt-6 print:mt-12 bg-slate-900 rounded-xl print:rounded-[2rem] p-5 print:p-10 text-white relative overflow-hidden shadow-xl print:shadow-2xl print:bg-white print:text-black print:border print:border-slate-900 print:shadow-none print:rounded-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl print:hidden" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-3xl print:hidden" />

                <div className="relative flex flex-col items-center">
                    <span className="text-[8px] print:text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-1 print:mb-4 print:text-slate-600">Gaji Bersih Diterima (Take Home Pay)</span>
                    <span className="text-2xl print:text-5xl font-black tracking-tighter mb-1 print:mb-2">{formatCurrency(payroll.netSalary)}</span>
                    <div className="flex items-center gap-1.5 mt-1 print:mt-2 px-3 py-1 print:px-4 print:py-1.5 bg-white/10 rounded-full backdrop-blur-sm print:bg-slate-100 print:text-slate-900">
                        <ShieldCheck className="h-3 w-3 print:h-4 print:w-4 text-emerald-400 print:text-emerald-700" />
                        <span className="text-[9px] print:text-[10px] font-bold uppercase tracking-widest text-slate-200 print:text-slate-700">Terverifikasi Sistem HRIS</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-end pt-4 print:pt-8 opacity-50 italic text-[9px] print:text-[10px] text-slate-400 print:opacity-100">
                <p>Dokumen ini dihasilkan secara otomatis dan sah tanpa tanda tangan basah.</p>
                <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            </div>
        </div>
    );
};
