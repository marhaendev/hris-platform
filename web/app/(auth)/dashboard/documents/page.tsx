'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Search, User } from 'lucide-react';

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all documents. Since we don't have a specific ALL docs API yet, I might need to create one or reuse.
        // For now, let's assume we create a new API route /api/documents or use existing search.
        // Wait, I created /api/employees/[id]/documents. I should make a global one.
        fetch('/api/documents')
            .then(res => res.json())
            .then(setDocuments)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filteredDocs = documents.filter(doc =>
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.employeeName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Arsip Dokumen</h1>
                    <p className="text-slate-500">Pusat penyimpanan dokumen seluruh karyawan.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>Semua Dokumen</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Cari dokumen atau karyawan..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dokumen</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pemilik</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipe</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal Upload</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium text-slate-700">{doc.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <User className="h-3.5 w-3.5 text-slate-400" />
                                                {doc.employeeName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                                            <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">{doc.type}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(doc.uploadedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <Button variant="ghost" size="icon" asChild>
                                                <a href={doc.fileUrl} target="_blank" download>
                                                    <Download className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                                </a>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredDocs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                                            {loading ? "Loading..." : "Tidak ada dokumen ditemukan."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
