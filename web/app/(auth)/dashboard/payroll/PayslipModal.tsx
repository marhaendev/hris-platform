'use client';

import React from 'react';
import {
    Printer,
    X,
    FileText as FileTextIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { PayslipDocument } from '@/components/payroll/PayslipDocument';

interface PayslipProps {
    isOpen: boolean;
    onClose: () => void;
    payroll: any;
}

export default function PayslipModal({ isOpen, onClose, payroll }: PayslipProps) {
    const { t } = useLanguage();
    if (!payroll) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl [&>button]:hidden">
                <DialogHeader className="p-6 bg-slate-900 text-white flex flex-row justify-between items-center">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <FileTextIcon className="h-5 w-5 text-emerald-400" />
                        {t.payrollDashboard.historyTitle.replace('History', 'Payslip')}
                    </DialogTitle>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            {t.common.print || 'Print'}
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <PayslipDocument payroll={payroll} />

                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #payslip-${payroll.id}, #payslip-${payroll.id} * {
                            visibility: visible;
                        }
                        #payslip-${payroll.id} {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            z-index: 9999;
                            padding: 20px;
                        }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}
