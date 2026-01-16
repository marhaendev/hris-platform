'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PayslipDocument } from '@/components/payroll/PayslipDocument';

export default function PayrollPrintPage() {
    const searchParams = useSearchParams();
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!month || !year) {
            setError('Bulan dan Tahun tidak ditemukan');
            setIsLoading(false);
            return;
        }

        fetch(`/api/payroll?month=${month}&year=${year}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPayrolls(data);
                } else {
                    setError(data.error || 'Gagal mengambil data');
                }
            })
            .catch(err => setError('Terjadi kesalahan koneksi'))
            .finally(() => setIsLoading(false));
    }, [month, year]);

    useEffect(() => {
        if (!isLoading && payrolls.length > 0) {
            // Auto print after small delay to ensure rendering
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    }, [isLoading, payrolls]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
                <p className="text-slate-500">Menyiapkan dokumen cetak...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center text-rose-500">
                {error}
            </div>
        );
    }

    if (payrolls.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-500">
                Tidak ada data penggajian untuk periode ini.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 print:bg-white">
            {/* Control Bar - Hidden when printing */}
            <div className="fixed top-0 left-0 right-0 bg-white border-b p-4 flex justify-between items-center shadow-sm print:hidden z-50">
                <div className="font-semibold text-slate-700">
                    Cetak Slip Gaji - Periode {month}/{year} ({payrolls.length} Karyawan)
                </div>
                <Button onClick={() => window.print()} className="gap-2">
                    <Printer className="h-4 w-4" />
                    Cetak Sekarang
                </Button>
            </div>

            {/* Print Content */}
            <div className="pt-20 print:pt-0 pb-10">
                <div className="max-w-4xl mx-auto space-y-8 print:space-y-0 print:w-full print:max-w-none">
                    {payrolls.map((payroll, index) => (
                        <div key={payroll.id} className="print:break-after-page print:h-screen print:flex print:flex-col print:justify-center">
                            <PayslipDocument
                                payroll={payroll}
                                className="shadow-sm border rounded-xl print:border-none print:shadow-none print:rounded-none"
                            />
                            {/* Visual separator for screen view only */}
                            {index < payrolls.length - 1 && (
                                <div className="h-8 bg-slate-50 print:hidden" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body {
                        background: white;
                    }
                }
            `}</style>
        </div>
    );
}
