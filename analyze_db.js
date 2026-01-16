const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'web', 'data', 'sqlite', 'hris.db');
const outputPath = path.join(__dirname, 'db_analysis.txt');

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(outputPath, `Database not found at ${dbPath}`);
    process.exit(1);
}

const db = new Database(dbPath, { readonly: true });
let output = '';

try {
    const stats = fs.statSync(dbPath);
    output += `File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`;

    const pageCount = db.prepare('PRAGMA page_count').get().page_count;
    const pageSize = db.prepare('PRAGMA page_size').get().page_size;
    const freelistCount = db.prepare('PRAGMA freelist_count').get().freelist_count;

    output += `Page Count: ${pageCount}\n`;
    output += `Page Size: ${pageSize} bytes\n`;
    output += `Freelist Count (Unused/Wasted Pages): ${freelistCount}\n`;
    output += `Wasted Space: ${(freelistCount * pageSize / 1024 / 1024).toFixed(2)} MB\n`;

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();

    output += '\n--- Table Analysis (Top rows or largest content) ---\n';
    tables.forEach(table => {
        try {
            const count = db.prepare(`SELECT COUNT(*) as count FROM "${table.name}"`).get().count;
            output += `Table: ${table.name}, Rows: ${count}\n`;
        } catch (e) {
            output += `Table: ${table.name}, Error: ${e.message}\n`;
        }
    });

} catch (error) {
    output += `Error: ${error.message}\n`;
} finally {
    db.close();
    fs.writeFileSync(outputPath, output);
    console.log('Analysis written to db_analysis.txt');
}
