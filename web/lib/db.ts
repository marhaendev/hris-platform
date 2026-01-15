/**
 * RECOVERY VERSION: 2.0.0
 * LOCK FIX: WAL DISABLED & PATH AUTO-DETECT
 */
console.log(">>> [DB] ENGINE VERSION 2.0.0 LOADING...");

import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { departmentsList } from './data/departments';
import { generateRolesForDept } from './data/roleTemplates';
import fs from 'fs';

// Database location: web/data/sqlite/hris.db
const rootPath = process.cwd();
let DB_DIR: string;

// Logika penentuan folder data yang lebih fleksibel (Host vs Docker)
if (fs.existsSync(path.resolve(rootPath, 'data/sqlite'))) {
    // Docker mode (/app/data/sqlite) atau running dari folder web
    DB_DIR = path.resolve(rootPath, 'data/sqlite');
} else if (fs.existsSync(path.resolve(rootPath, 'web/data/sqlite'))) {
    // Host mode (running dari root project)
    DB_DIR = path.resolve(rootPath, 'web/data/sqlite');
} else {
    // Fallback default
    DB_DIR = path.resolve(rootPath, rootPath.endsWith('web') ? 'data/sqlite' : 'web/data/sqlite');
}

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
    console.log(">>> [DB] Creating missing directory:", DB_DIR);
    fs.mkdirSync(DB_DIR, { recursive: true });
}

const dbPath = process.env.WEB_DATABASE_URL
    ? process.env.WEB_DATABASE_URL.replace('file:', '')
    : process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace('file:', '')
        : path.join(DB_DIR, 'hris.db');

console.log(">>> [DB] Opening database at:", dbPath);

// Cek eksistensi dan akses file secara manual sebelum dibuka
try {
    if (fs.existsSync(dbPath)) {
        fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
        console.log(">>> [DB] File exists and is readable/writable.");
    } else {
        console.warn(">>> [DB] File does NOT exist at path, better-sqlite3 will create it.");
    }
} catch (accessErr: any) {
    console.error(">>> [DB] PRE-OPEN ACCESS ERROR:", accessErr.message);
}

const db = new Database(dbPath, {
    verbose: console.log,
    timeout: 10000 // Tingkatkan timeout ke 10 detik
});

// Gunakan journal_mode = DELETE untuk stabilitas di folder mount Windows (WSL)
try {
    console.log(">>> [DB] Setting journal_mode to DELETE...");
    db.pragma('journal_mode = DELETE');
    db.pragma('foreign_keys = ON');
    console.log(">>> [DB] Pragmas set successfully.");
} catch (pragmaErr: any) {
    console.error(">>> [DB] PRAGMA FAILURE:", pragmaErr.message);
    // Kita tidak throw agar server tetap jalan (hanya log saja)
    // Error asli akan muncul saat query dijalankan
}

console.log(">>> [DB] Connection successful.");

// Initialize Schema
function initDb() {
    console.log(">>> [DB] Initializing Schema checks...");
    // SaaS: Company Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS Company (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT,
            logo_url TEXT,
            phone TEXT,
            whatsapp TEXT,
            email TEXT,
            website TEXT,
            subscription_plan TEXT DEFAULT 'FREE',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // User Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS User (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'EMPLOYEE',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            phone TEXT,
            companyId INTEGER DEFAULT 1,
            username TEXT
        )
    `);

    // Applicant Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS Applicant (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jobId INTEGER NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            resume_url TEXT,
            cover_letter TEXT,
            status TEXT DEFAULT 'APPLIED',
            applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            companyId INTEGER DEFAULT 1
        )
    `);

    // Interview Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS Interview (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            applicantId INTEGER NOT NULL,
            jobId INTEGER NOT NULL,
            scheduled_date DATETIME NOT NULL,
            interviewer TEXT,
            notes TEXT,
            status TEXT DEFAULT 'SCHEDULED',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            companyId INTEGER DEFAULT 1,
            FOREIGN KEY (applicantId) REFERENCES Applicant(id) ON DELETE CASCADE
        )
    `);

    // FAQ Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS FAQ (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            display_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            category TEXT DEFAULT 'General',
            companyId INTEGER DEFAULT 1
        )
    `);

    // OTP Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS OTP (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            identifier TEXT NOT NULL,
            code TEXT NOT NULL,
            expiresAt DATETIME NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Department Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS Department (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT,
            companyId INTEGER DEFAULT 1,
            UNIQUE(name, companyId)
        )
    `);

    // MasterPosition Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS MasterPosition (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL UNIQUE,
            defaultLevel TEXT DEFAULT 'Staff',
            category TEXT
        )
    `);

    // Position Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS Position (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            departmentId INTEGER NOT NULL,
            level TEXT DEFAULT 'Staff',
            companyId INTEGER DEFAULT 1,
            FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE CASCADE
        )
    `);

    // Employee Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS Employee (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER UNIQUE NOT NULL,
            position TEXT,
            departmentId INTEGER,
            positionId INTEGER,
            baseSalary REAL NOT NULL,
            joinDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            annualLeaveQuota INTEGER DEFAULT 12,
            companyId INTEGER DEFAULT 1,
            FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
            FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE SET NULL,
            FOREIGN KEY (positionId) REFERENCES Position(id) ON DELETE SET NULL
        )
    `);

    // JobPosting Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS JobPosting (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            departmentId INTEGER,
            positionId INTEGER,
            description TEXT,
            requirements TEXT,
            status TEXT DEFAULT 'DRAFT',
            salary_min REAL,
            salary_max REAL,
            location TEXT,
            employment_type TEXT DEFAULT 'FULL_TIME',
            posted_date DATETIME,
            closing_date DATETIME,
            created_by INTEGER,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            companyId INTEGER DEFAULT 1,
            FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE SET NULL,
            FOREIGN KEY (positionId) REFERENCES Position(id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES User(id) ON DELETE SET NULL
        )
    `);

    // RolePermission Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS RolePermission (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            companyId INTEGER DEFAULT 1,
            role TEXT NOT NULL,
            menu_id TEXT NOT NULL,
            can_view INTEGER DEFAULT 1,
            can_edit INTEGER DEFAULT 0,
            FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE CASCADE,
            UNIQUE(companyId, role, menu_id)
        )
    `);

    // EmployeeDocument Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS EmployeeDocument (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeId INTEGER NOT NULL,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            fileUrl TEXT NOT NULL,
            uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            companyId INTEGER DEFAULT 1,
            FOREIGN KEY (employeeId) REFERENCES Employee(id) ON DELETE CASCADE
        )
    `);

    // Attendance Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS Attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeId INTEGER NOT NULL,
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            checkIn DATETIME,
            checkOut DATETIME,
            status TEXT DEFAULT 'PRESENT',
            checkInStatus TEXT, -- ONTIME, LATE
            checkOutType TEXT, -- MANUAL, AUTO
            companyId INTEGER DEFAULT 1,
            latitude REAL,
            longitude REAL,
            address TEXT,
            FOREIGN KEY (employeeId) REFERENCES Employee(id) ON DELETE CASCADE
        )
    `);

    // Payroll Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS Payroll (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeId INTEGER NOT NULL,
            period DATETIME NOT NULL,
            totalSalary REAL NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            companyId INTEGER DEFAULT 1,
            FOREIGN KEY (employeeId) REFERENCES Employee(id) ON DELETE CASCADE
        )
    `);

    // SystemSetting Table
    // Migration: We need to recreate table to add composite primary key
    // But since sqlite doesn't support ALTER TABLE DROP PRIMARY KEY easily, 
    // we will check if companyId column exists, if not we recreate.

    // Check if companyId exists
    try {
        const hasCompanyId = db.prepare("SELECT count(*) as count FROM pragma_table_info('SystemSetting') WHERE name='companyId'").get() as any;

        if (!hasCompanyId || hasCompanyId.count === 0) {
            console.log(">>> [DB] Migrating SystemSetting table to support per-company settings...");

            // Backup existing data
            const existingSettings = db.prepare("SELECT * FROM SystemSetting").all();

            // Drop old table
            db.exec("DROP TABLE SystemSetting");

            // Recreate with new schema
            db.exec(`
                CREATE TABLE IF NOT EXISTS SystemSetting (
                    key TEXT NOT NULL,
                    value TEXT NOT NULL,
                    description TEXT,
                    companyId INTEGER DEFAULT 1,
                    PRIMARY KEY (key, companyId)
                )
            `);

            // Restore data (assign to companyId 1 by default)
            const insert = db.prepare("INSERT INTO SystemSetting (key, value, description, companyId) VALUES (?, ?, ?, 1)");
            existingSettings.forEach((s: any) => {
                insert.run(s.key, s.value, s.description);
            });
            console.log(">>> [DB] SystemSetting migration complete.");
        }
    } catch (e) {
        // If table doesn't exist yet, just create it
        db.exec(`
            CREATE TABLE IF NOT EXISTS SystemSetting (
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                description TEXT,
                companyId INTEGER DEFAULT 1,
                PRIMARY KEY (key, companyId)
            )
        `);
    }

    // MasterPaymentMethod Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS MasterPaymentMethod (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT,
            is_active INTEGER DEFAULT 1,
            description TEXT
        )
    `);

    // MasterBank Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS MasterBank (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE,
            name TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // MasterDepartment Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS MasterDepartment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            code TEXT,
            description TEXT
        )
    `);

    // LeaveRequest Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS LeaveRequest (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeId INTEGER NOT NULL,
            type TEXT NOT NULL,
            startDate DATETIME NOT NULL,
            endDate DATETIME NOT NULL,
            reason TEXT,
            attachment TEXT,
            status TEXT DEFAULT 'PENDING',
            approvedBy INTEGER,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employeeId) REFERENCES Employee(id) ON DELETE CASCADE,
            FOREIGN KEY (approvedBy) REFERENCES User(id) ON DELETE SET NULL
        )
    `);

    // Notification Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS Notification (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            href TEXT,
            targetRoles TEXT DEFAULT 'ADMIN,SUPERADMIN,EMPLOYEE',
            category TEXT DEFAULT 'general',
            isActive INTEGER DEFAULT 1,
            companyId INTEGER DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // ActivityLog Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS ActivityLog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            action TEXT NOT NULL,
            description TEXT,
            ipAddress TEXT,
            userAgent TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            companyId INTEGER DEFAULT 1,
            FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
        )
    `);

    // WhatsAppBot Table (Shared Bots)
    db.exec(`
        CREATE TABLE IF NOT EXISTS WhatsAppBot (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sessionId TEXT UNIQUE NOT NULL,
            name TEXT,
            isGlobal INTEGER DEFAULT 0,
            createdBy INTEGER,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE SET NULL
        )
    `);

    // --- Seeding ---

    // Initial System Settings (Granular Seeding)
    const seedSettings = [
        { key: 'otp_duration_minutes', value: '5', desc: 'Durasi masa berlaku kode OTP dalam menit' },
        { key: 'jwt_expiration_hours', value: '1', desc: 'Masa berlaku session JWT dalam satuan jam' },
        { key: 'jwt_expiration_minutes', value: '0', desc: 'Masa berlaku session JWT dalam satuan menit' }
    ];

    const insertSetting = db.prepare('INSERT OR IGNORE INTO SystemSetting (key, value, description, companyId) VALUES (?, ?, ?, 1)');
    seedSettings.forEach(s => {
        insertSetting.run(s.key, s.value, s.desc);
    });

    // Default Company
    const companyCount = db.prepare('SELECT count(*) as count FROM Company').get() as { count: number };
    if (companyCount.count === 0) {
        db.prepare('INSERT INTO Company (name, subscription_plan) VALUES (?, ?)').run('Default Company', 'ENTERPRISE');
    }

    // Master Departments
    const masterDeptCount = db.prepare('SELECT count(*) as count FROM MasterDepartment').get() as { count: number };
    if (masterDeptCount.count === 0) {
        const insertMasterDept = db.prepare('INSERT INTO MasterDepartment (name, code) VALUES (?, ?)');
        departmentsList.forEach(dept => {
            insertMasterDept.run(dept.name, dept.code);
        });
    }

    // Default Super Admin (Recovery Logic)
    // Default Super Admin (Recovery Logic)
    let admin = db.prepare('SELECT * FROM User WHERE username = ? OR id = 1').get('hasan') as any;
    const hashedPassword = bcrypt.hashSync('909090', 10);

    if (!admin) {
        // If no admin exists at all (fresh install)
        db.prepare('INSERT INTO User (username, password, name, email, role, companyId) VALUES (?, ?, ?, ?, ?, ?)')
            .run('hasan', hashedPassword, 'hasan', 'hasanaskari.id@gmail.com', 'SUPERADMIN', 1);
        console.log(">>> [DB] Default Admin created (hasan / 909090)");
    } else {
        // Force update existing admin/id=1 to new credentials
        db.prepare('UPDATE User SET username = ?, password = ?, name = ?, email = ?, role = ? WHERE id = ?')
            .run('hasan', hashedPassword, 'hasan', 'hasanaskari.id@gmail.com', 'SUPERADMIN', admin.id);
        console.log(">>> [DB] Admin account updated/recovered (username set to 'hasan')");
    }
    // --- Migrations ---
    try {
        db.exec("ALTER TABLE LeaveRequest ADD COLUMN attachment TEXT");
        console.log(">>> [DB] Migration: Added attachment column to LeaveRequest");
    } catch (e) { }

    try {
        db.exec("ALTER TABLE Employee ADD COLUMN annualLeaveQuota INTEGER DEFAULT 12");
        console.log(">>> [DB] Migration: Added annualLeaveQuota column to Employee");
    } catch (e) { }

    try {
        db.exec("ALTER TABLE Company ADD COLUMN phone TEXT");
        db.exec("ALTER TABLE Company ADD COLUMN whatsapp TEXT");
        db.exec("ALTER TABLE Company ADD COLUMN email TEXT");
        db.exec("ALTER TABLE Company ADD COLUMN website TEXT");
        console.log(">>> [DB] Migration: Added contact columns to Company");
    } catch (e) { }

    try {
        db.exec("ALTER TABLE Company ADD COLUMN about_config TEXT");
        console.log(">>> [DB] Migration: Added about_config column to Company");
    } catch (e) { }

    try {
        db.exec("ALTER TABLE Company ADD COLUMN whatsapp_session_id TEXT");
        console.log(">>> [DB] Migration: Added whatsapp_session_id column to Company");
    } catch (e) { }

    // --- Payroll System Enhancements ---
    try {
        db.exec("ALTER TABLE Employee ADD COLUMN npwp TEXT");
        db.exec("ALTER TABLE Employee ADD COLUMN taxStatus TEXT DEFAULT 'TK/0'");
        db.exec("ALTER TABLE Employee ADD COLUMN bpjsKesehatan INTEGER DEFAULT 1");
        db.exec("ALTER TABLE Employee ADD COLUMN bpjsKetenagakerjaan INTEGER DEFAULT 1");
        console.log(">>> [DB] Migration: Added tax and BPJS columns to Employee");
    } catch (e) { }

    try {
        db.exec("ALTER TABLE Payroll ADD COLUMN baseSalary REAL DEFAULT 0");
        db.exec("ALTER TABLE Payroll ADD COLUMN allowances REAL DEFAULT 0");
        db.exec("ALTER TABLE Payroll ADD COLUMN deductions REAL DEFAULT 0");
        db.exec("ALTER TABLE Payroll ADD COLUMN pph21 REAL DEFAULT 0");
        db.exec("ALTER TABLE Payroll ADD COLUMN netSalary REAL DEFAULT 0");
        db.exec("ALTER TABLE Payroll ADD COLUMN status TEXT DEFAULT 'DRAFT'");
        console.log(">>> [DB] Migration: Added detailed columns to Payroll");
    } catch (e) { }

    // --- Payroll Settings Table ---
    db.exec(`
        CREATE TABLE IF NOT EXISTS PayrollSetting (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            companyId INTEGER DEFAULT 1,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            label TEXT,
            description TEXT,
            isActive INTEGER DEFAULT 1,
            UNIQUE(key, companyId)
        )
    `);

    // Migration for existing table
    try {
        db.exec("ALTER TABLE PayrollSetting ADD COLUMN isActive INTEGER DEFAULT 1");
    } catch (e) { }

    // Bootstrap default settings
    const defaultSettings = [
        { key: 'bpjs_health_percent', value: '1', label: 'BPJS Kesehatan (%)', description: 'Potongan BPJS Kesehatan karyawan' },
        { key: 'bpjs_employment_percent', value: '2', label: 'BPJS Ketenagakerjaan (%)', description: 'Potongan BPJS Ketenagakerjaan (JHT) karyawan' },
        { key: 'pension_percent', value: '1', label: 'Jaminan Pensiun (%)', description: 'Potongan Jaminan Pensiun karyawan' },
        { key: 'tax_biaya_jabatan_percent', value: '5', label: 'Biaya Jabatan (%)', description: 'Persentase pengurang Biaya Jabatan PPh21' },
        { key: 'tax_biaya_jabatan_max', value: '500000', label: 'Maks. Biaya Jabatan (Bulan)', description: 'Maksimal Pengurang Biaya Jabatan per bulan' },
        { key: 'tax_pph21_layer1', value: '5', label: 'PPh21 Lapisan 1 (0 - 60jt)', description: 'Tarif pph21 untuk PKP sampai dengan Rp 60.000.000 per tahun' },
        { key: 'tax_pph21_layer2', value: '15', label: 'PPh21 Lapisan 2 (60jt - 250jt)', description: 'Tarif pph21 untuk PKP di atas Rp 60.000.000 s/d Rp 250.000.000' },
        { key: 'tax_pph21_layer3', value: '25', label: 'PPh21 Lapisan 3 (250jt - 500jt)', description: 'Tarif pph21 untuk PKP di atas Rp 250.000.000 s/d Rp 500.000.000' },
        { key: 'tax_pph21_layer4', value: '30', label: 'PPh21 Lapisan 4 (500jt - 5M)', description: 'Tarif pph21 untuk PKP di atas Rp 500.000.000 s/d Rp 5.000.000.000' },
        { key: 'tax_pph21_layer5', value: '35', label: 'PPh21 Lapisan 5 (> 5M)', description: 'Tarif pph21 untuk PKP di atas Rp 5.000.000.000' },
    ];

    try {
        const insertSetting = db.prepare('INSERT OR IGNORE INTO PayrollSetting (key, value, label, description) VALUES (?, ?, ?, ?)');
        for (const s of defaultSettings) {
            insertSetting.run(s.key, s.value, s.label, s.description);
        }
    } catch (e) { }

    // --- FAQ Multilingual Migration ---
    try {
        db.exec("ALTER TABLE FAQ ADD COLUMN question_id TEXT");
        db.exec("ALTER TABLE FAQ ADD COLUMN question_en TEXT");
        db.exec("ALTER TABLE FAQ ADD COLUMN answer_id TEXT");
        db.exec("ALTER TABLE FAQ ADD COLUMN answer_en TEXT");
        console.log(">>> [DB] Migration: Added multilingual columns to FAQ");
    } catch (e) { }

    // Seed/Update FAQ Data
    try {
        // Clear old FAQs to ensure fresh accurate data
        const faqCount = db.prepare("SELECT COUNT(*) as count FROM FAQ WHERE question_id IS NOT NULL").get() as any;

        // Only re-seed if we just migrated or if needed. Ideally we want to force update to fix overclaims.
        // Let's force delete old non-multilingual ones or just replace all system FAQs.
        // Simplified approach: Delete 'General' category standard FAQs and re-insert.

        db.prepare("DELETE FROM FAQ WHERE category = 'General'").run();

        const newFaqs = [
            {
                q_id: "Bagaimana cara melakukan absensi?",
                q_en: "How do I clock in/out?",
                a_id: "Absensi dilakukan melalui aplikasi mobile/web dengan mengaktifkan GPS. Sistem akan mendeteksi lokasi (Geotagging) dan menghitung keterlambatan secara otomatis.",
                a_en: "Attendance is done via mobile/web app by enabling GPS. The system detects location (Geotagging) and calculates lateness automatically.",
                order: 1
            },
            {
                q_id: "Apakah perhitungan gaji sudah otomatis?",
                q_en: "Is payroll calculation automated?",
                a_id: "Ya, sistem menghitung gaji pokok, tunjangan, dan potongan secara otomatis. Hasil perhitungan dapat diekspor ke format Excel/CSV.",
                a_en: "Yes, the system calculates basic salary, allowances, and deductions automatically. Results can be exported to Excel/CSV.",
                order: 2
            },
            {
                q_id: "Bagaimana cara mengajukan cuti?",
                q_en: "How to apply for leave?",
                a_id: "Karyawan dapat mengajukan cuti melalui menu 'Cuti & Izin'. Kuota cuti akan berkurang otomatis setelah disetujui.",
                a_en: "Employees can apply for leave via the 'Leave & Permit' menu. Leave quota is automatically deducted upon approval.",
                order: 3
            },
            {
                q_id: "Apa fungsi integrasi WhatsApp?",
                q_en: "What is the WhatsApp integration for?",
                a_id: "WhatsApp digunakan untuk mengirim kode OTP saat Login, memastikan akun Anda lebih aman.",
                a_en: "WhatsApp is used to send OTP codes during Login, ensuring your account is more secure.",
                order: 4
            },
            {
                q_id: "Apakah data karyawan aman?",
                q_en: "Is employee data secure?",
                a_id: "Tentu. Data karyawan disimpan dengan enkripsi standar industri dan hanya dapat diakses oleh Admin yang berwenang.",
                a_en: "Absolutely. Employee data is stored with industry-standard encryption and accessible only by authorized Admins.",
                order: 5
            }
        ];

        const insertFaq = db.prepare(`
            INSERT INTO FAQ (question, answer, question_id, question_en, answer_id, answer_en, category, display_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 'General', ?, 1)
        `);

        for (const f of newFaqs) {
            // Fill default columns with ID content as fallback
            insertFaq.run(f.q_id, f.a_id, f.q_id, f.q_en, f.a_id, f.a_en, f.order);
        }
        console.log(">>> [DB] Seeding: Updated FAQ data");

    } catch (e: any) {
        console.error(">>> [DB] FAQ Seeding Error:", e.message);
    }

    console.log(">>> [DB] Database initialization complete.");
}

// Try running init during import
try {
    initDb();
} catch (e: any) {
    console.error(">>> [DB] Seeding Error:", e.message);
}

export default db;
