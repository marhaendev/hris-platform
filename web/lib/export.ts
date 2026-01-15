/**
 * Utilitas ekspor data tanpa dependensi eksternal.
 * Menggunakan teknik Blob dan data URI untuk mengunduh file.
 */

/**
 * Ekspor data ke format CSV
 */
export const exportToCsv = async (filename: string, rows: (string | number | boolean | null | undefined)[][]) => {
    // Menambahkan BOM (Byte Order Mark) agar Excel mendeteksi encoding UTF-8 dengan benar (terutama untuk karakter spesial)
    const BOM = "\uFEFF";
    const csvContent = rows
        .map(e => e.map(cell => {
            const content = cell === null || cell === undefined ? '' : String(cell);
            // Escape tanda kutip ganda dan bungkus setiap sel dengan tanda kutip
            return `"${content.replace(/"/g, '""')}"`;
        }).join(","))
        .join("\n");

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
};

/**
 * Ekspor data ke format Excel (format HTML Table .xls)
 * Teknik ini membuat file yang dapat dibuka oleh Microsoft Excel tanpa pustaka tambahan.
 */
export const exportToExcel = async (filename: string, sheetName: string, rows: (string | number | boolean | null | undefined)[][]) => {
    let table = '<table border="1">';
    rows.forEach((row, index) => {
        table += '<tr>';
        row.forEach(cell => {
            const content = cell === null || cell === undefined ? '' : String(cell);
            // Gaya tebal untuk header (baris pertama)
            const style = index === 0 ? 'style="font-weight:bold;background-color:#ececec"' : '';
            table += `<td ${style}>${content}</td>`;
        });
        table += '</tr>';
    });
    table += '</table>';

    const dataType = 'application/vnd.ms-excel';
    const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>${sheetName}</x:Name>
                            <x:WorksheetOptions>
                                <x:DisplayGridlines/>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
        </head>
        <body>
            ${table}
        </body>
        </html>`;

    const blob = new Blob([template], { type: dataType });
    // Gunakan ekstensi .xls untuk kompatibilitas terbaik dengan trik HTML ini
    downloadFile(blob, filename.endsWith('.xls') ? filename : `${filename}.xls`);
};

/**
 * Fungsi helper untuk memicu pengunduhan file di browser
 */
function downloadFile(blob: Blob, filename: string) {
    if (typeof window === 'undefined') return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
