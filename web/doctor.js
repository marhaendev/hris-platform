const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(process.cwd(), 'data/sqlite/hris.db');
const db = new Database(dbPath);

console.log(">>> [DOCTOR] Starting Attendance Data Integrity Fix...");

try {
    // 1. Sync companyId from Employee/User to Attendance
    // We use User table as the source of truth for companyId
    const syncResult = db.prepare(`
        UPDATE Attendance 
        SET companyId = (
            SELECT u.companyId 
            FROM Employee e 
            JOIN User u ON e.userId = u.id 
            WHERE e.id = Attendance.employeeId
        )
        WHERE companyId IS NULL
    `).run();

    console.log(`Synced ${syncResult.changes} records in Attendance table.`);

    // 2. Logging for debug
    const total = db.prepare("SELECT count(*) as count FROM Attendance").get().count;
    const withCompany = db.prepare("SELECT count(*) as count FROM Attendance WHERE companyId IS NOT NULL").get().count;
    console.log(`Total: ${total}, With CompanyID: ${withCompany}`);

} catch (err) {
    console.error("DOCTOR ERROR:", err.message);
} finally {
    db.close();
    console.log(">>> [DOCTOR] Finished.");
}
