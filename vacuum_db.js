const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'web', 'data', 'sqlite', 'hris.db');
const db = new Database(dbPath);

console.log('Starting VACUUM...');
const start = Date.now();

try {
    db.exec('VACUUM');
    console.log(`VACUUM completed in ${(Date.now() - start)}ms`);
} catch (e) {
    console.error('VACUUM failed:', e);
} finally {
    db.close();
}
