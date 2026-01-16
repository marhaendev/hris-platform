'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    docId: string | number | null;
    title: string;
}

export function DocumentPreviewModal({ isOpen, onOpenChange, docId, title }: DocumentPreviewModalProps) {
    const [isLoading, setIsLoading] = useState(true);

    if (!docId) return null;

    const previewUrl = `/preview/document/${docId}`;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="text-lg font-bold truncate pr-8">{title}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 relative bg-slate-100 flex items-center justify-center">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-100/50">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                    )}
                    <iframe
                        src={previewUrl}
                        className="w-full h-full border-none"
                        onLoad={() => setIsLoading(false)}
                        title={title}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
