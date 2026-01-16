const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'web', 'data', 'sqlite', 'hris.db');
const db = new Database(dbPath);

console.log('=== Checking OWNER and ADMIN users ===\n');

// Check all companies
const companies = db.prepare('SELECT id, name FROM Company').all();
console.log('Companies:', companies);
console.log('');

// Check OWNER users
const owners = db.prepare('SELECT id, name, email, role, companyId FROM User WHERE role = "OWNER"').all();
console.log('OWNER users:');
console.table(owners);

// Check ADMIN users
const admins = db.prepare('SELECT id, name, email, role, companyId FROM User WHERE role = "ADMIN"').all();
console.log('ADMIN users:');
console.table(admins);

// Test domain extraction
console.log('\n=== Testing domain extraction ===');
const testEmail = 'owner@ssms.co.id';
const domainMatch = testEmail.match(/@(.+)$/);
if (domainMatch) {
    console.log(`Email: ${testEmail}`);
    console.log(`Extracted domain: ${domainMatch[1]}`);
}

db.close();
