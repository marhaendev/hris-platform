const express = require('express');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const Database = require('better-sqlite3');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const BASE_AUTH_FOLDER = process.env.AUTH_FOLDER || path.join(__dirname, '../../sessions');

// Set global error handlers
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Map to store session data: sessionId -> { sock, status, qr, connectionStartTimestamp }
const sessions = new Map();
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

async function notifyWebStatus(sessionId, status) {
    try {
        console.log(`[Webhook] Notifying web about session ${sessionId} status: ${status}`);
        fetch(`${WEB_URL}/api/notifications/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'WHATSAPP_STATUS_CHANGED', sessionId, status })
        }).catch(e => console.error(`[Webhook] Failed to notify web: ${e.message}`));
    } catch (err) {
        console.error(`[Webhook] notifyWebStatus Error: ${err.message}`);
    }
}

// Global cache for Baileys version to avoid redundant fetching
let cachedVersion = null;

// Ensure base folder exists
if (!fs.existsSync(BASE_AUTH_FOLDER)) {
    fs.mkdirSync(BASE_AUTH_FOLDER);
}

// === HELPER FUNCTIONS ===

function getSessionIds() {
    try {
        if (!fs.existsSync(BASE_AUTH_FOLDER)) {
            console.log(`[FS] Auth folder ${BASE_AUTH_FOLDER} not found.`);
            return [];
        }
        const files = fs.readdirSync(BASE_AUTH_FOLDER);
        return files.filter(file => {
            try {
                const fullPath = path.join(BASE_AUTH_FOLDER, file);
                const isDir = fs.statSync(fullPath).isDirectory();
                return isDir;
            } catch (statErr) {
                return false;
            }
        });
    } catch (err) {
        console.error('[FS] Error reading session ids:', err);
        return [];
    }
}

// Simple in-memory log buffer
const logBuffer = [];
const MAX_LOGS = 100;

function addToLogs(type, args) {
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    const timestamp = new Date().toLocaleTimeString();
    process.stdout.write(`[${timestamp}] [${type.toUpperCase()}] ${msg}\n`); // Write to actual stdout

    // Add to buffer
    logBuffer.push(`[${timestamp}] [${type.toUpperCase()}] ${msg}`);
    if (logBuffer.length > MAX_LOGS) logBuffer.shift();
}

// Override console methods to capture logs
const originalLog = console.log;
const originalError = console.error;

console.log = function (...args) {
    addToLogs('info', args);
};

console.error = function (...args) {
    addToLogs('error', args);
};

async function startSession(sessionId) {
    const authPath = path.join(BASE_AUTH_FOLDER, sessionId);

    console.log(`Starting session: ${sessionId}`);

    // Ensure state is clean before starting
    cleanupSession(sessionId);

    // Initialize session state
    sessions.set(sessionId, { status: 'starting', qr: null, sock: null });
    const sessionData = sessions.get(sessionId);

    console.log(`[${sessionId}] Loading auth state...`);
    let state, saveCreds;
    try {
        const authData = await useMultiFileAuthState(authPath);
        state = authData.state;
        saveCreds = authData.saveCreds;
        console.log(`[${sessionId}] Auth state loaded successfully`);
    } catch (authErr) {
        console.error(`[${sessionId}] FAILED TO LOAD AUTH STATE:`, authErr);
        sessionData.status = 'error';
        return;
    }

    let version;
    if (cachedVersion) {
        version = cachedVersion;
        console.log(`[${sessionId}] Using cached version: ${version.join('.')}`);
    } else {
        console.log(`[${sessionId}] Fetching latest version (with 10s timeout)...`);
        try {
            // Add timeout for fetching version
            const fetchPromise = fetchLatestBaileysVersion();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Fetch version timeout')), 10000)
            );

            const v = await Promise.race([fetchPromise, timeoutPromise]);
            version = v.version;
            cachedVersion = version; // Cache for next sessions
            console.log(`[${sessionId}] Latest version fetched: ${version.join('.')}`);
        } catch (e) {
            console.warn(`[${sessionId}] Failed to fetch version or timeout, using fallback:`, e.message);
            version = [2, 3000, 1015901307]; // Fallback version
            cachedVersion = version;
        }
    }

    console.log(`[${sessionId}] Initializing WASocket instance...`);
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'warn' }),
        auth: state,
        browser: ["HRIS Bot", "MacOS", "10.15.7"], // Using more standard browser string
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        connectTimeoutMs: 60000,
        retryRequestDelayMs: 250,
        msgRetryCounterCache: {} // Add cache to prevent some Baileys issues
    });

    // We already have sessionData from above
    sessionData.sock = sock;

    sock.ev.on('creds.update', () => {
        console.log(`[${sessionId}] Credentials updated (saving...)`);
        saveCreds();
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update;
        console.log(`[${sessionId}] Connection Update: connection=${connection || 'N/A'}, qr=${qr ? 'YES' : 'NO'}, isNewLogin=${isNewLogin}`);

        if (qr) {
            console.log(`[${sessionId}] QR updated, status changing to scan_qr`);
            sessionData.qr = qr;
            sessionData.status = 'scan_qr';
            notifyWebStatus(sessionId, 'scan_qr');
        }

        if (connection === 'connecting') {
            console.log(`[${sessionId}] Socket is connecting...`);
            sessionData.status = 'connecting';
            notifyWebStatus(sessionId, 'connecting');
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const errorMsg = lastDisconnect?.error?.message || 'Unknown error';
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`[${sessionId}] Connection closed. Reason: ${errorMsg} (${statusCode}), Reconnect: ${shouldReconnect}`);

            if (statusCode === DisconnectReason.loggedOut) {
                console.log(`[${sessionId}] Logged out. Cleaning up...`);
                cleanupSession(sessionId);
                notifyWebStatus(sessionId, 'disconnected');
                try {
                    fs.rmSync(authPath, { recursive: true, force: true });
                    console.log(`[${sessionId}] Auth folder deleted`);
                } catch (err) {
                    console.error(`[${sessionId}] Failed to delete folder:`, err);
                }
            } else if (shouldReconnect) {
                sessionData.status = 'reconnecting';
                notifyWebStatus(sessionId, 'reconnecting');
                console.log(`[${sessionId}] Reconnecting in 3s...`);
                setTimeout(() => startSession(sessionId), 3000);
            }
        } else if (connection === 'open') {
            const userPhone = sock.user.id.split(':')[0];
            console.log(`[${sessionId}] Session connected! User Phone: ${userPhone}`);
            sessionData.status = 'connected';
            sessionData.qr = null;
            sessionData.phone = userPhone; // Store in memory only
            notifyWebStatus(sessionId, 'connected');

            // If it's a NEW session, we MUST rename the folder to make it persistent
            if (sessionId.startsWith('new-')) {
                console.log(`[${sessionId}] NEW session detected. Scheduling rename to ${userPhone} in 5s...`);

                setTimeout(async () => {
                    try {
                        console.log(`[${sessionId}] Closing socket for rename...`);
                        sock.end(undefined);
                        sessions.delete(sessionId);

                        const newAuthPath = path.join(BASE_AUTH_FOLDER, userPhone);
                        if (fs.existsSync(newAuthPath)) {
                            console.log(`[${sessionId}] Target ${userPhone} exists, replacing...`);
                            fs.rmSync(newAuthPath, { recursive: true, force: true });
                        }

                        console.log(`[${sessionId}] Renaming folder to ${userPhone}`);
                        fs.renameSync(authPath, newAuthPath);

                        console.log(`[${userPhone}] Restarting as persistent session`);
                        startSession(userPhone);
                    } catch (err) {
                        console.error(`[${sessionId}] Renaming failed:`, err);
                        startSession(sessionId);
                    }
                }, 5000);
            }
        }
    });

    sessions.set(sessionId, sessionData);

    // Auto-cleanup for new sessions that aren't scanned/connected within 10 mins
    if (sessionId.startsWith('new-')) {
        setTimeout(() => {
            const current = sessions.get(sessionId);
            if (current && (current.status === 'scan_qr' || current.status === 'connecting')) {
                console.log(`[${sessionId}] Auto-cleanup: Session timed out after 10 mins without connection`);
                cleanupSession(sessionId);
                try {
                    fs.rmSync(authPath, { recursive: true, force: true });
                } catch (e) { }
            }
        }, 10 * 60 * 1000);
    }
}

function cleanupSession(sessionId) {
    if (sessions.has(sessionId)) {
        const session = sessions.get(sessionId);
        if (session.sock) {
            session.sock.end(undefined);
        }
        sessions.delete(sessionId);
    }
}

// Initialize existing sessions on startup
function initAllSessions() {
    const existingIds = getSessionIds();
    const sortedIds = existingIds.filter(id => !id.startsWith('new-'));
    const staleTempIds = existingIds.filter(id => id.startsWith('new-'));

    console.log(`Found existing sessions: ${existingIds.join(', ')}`);
    if (staleTempIds.length > 0) {
        console.log(`Cleaning up ${staleTempIds.length} stale temporary sessions...`);
        staleTempIds.forEach(id => {
            try {
                fs.rmSync(path.join(BASE_AUTH_FOLDER, id), { recursive: true, force: true });
            } catch (e) { }
        });
    }

    console.log(`Starting persistent sessions: ${sortedIds.join(', ')}`);
    sortedIds.forEach(id => {
        startSession(id).catch(err => console.error(`Failed to init session ${id}:`, err));
    });
}

// === ROUTES ===

// List all sessions and their status
app.get('/sessions', (req, res) => {
    const allIds = getSessionIds();

    // Merge memory sessions with storage IDs
    const result = allIds.map(id => {
        const session = sessions.get(id);
        return {
            id,
            status: session ? session.status : 'stopped',
            phone: session && session.phone ? session.phone : id
        };
    });

    res.json({ sessions: result });
});

app.get('/sessions/:id', (req, res) => {
    const { id } = req.params;
    const session = sessions.get(id);

    if (!session) {
        // Check if it exists in FS but not in memory
        const allIds = getSessionIds();
        if (allIds.includes(id)) {
            return res.json({ id, status: 'stopped', phone: id });
        }
        return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
        id,
        status: session.status,
        phone: session.phone || id
    });
});

app.get('/logs', (req, res) => {
    res.json({ logs: logBuffer });
});

app.post('/logs/clear', (req, res) => {
    logBuffer.length = 0;
    console.log("[API] Logs cleared by user");
    res.json({ success: true });
});

// TEST QR Endpoint
app.get('/test-qr', async (req, res) => {
    try {
        const testContent = "This is a test QR code for HRIZ Bot Verification";
        const url = await QRCode.toDataURL(testContent);
        res.json({ status: 'success', message: 'QR Library is working', qrImage: url });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate Test QR: ' + err.message });
    }
});

// Create NEW Session
app.post('/sessions/add', async (req, res) => {
    console.log("-----------------------------------------");
    console.log("POST /sessions/add - Creating new temp session");
    const tempId = `new-${Date.now()}`;
    console.log(`[${tempId}] Initializing new background session...`);

    // Start session in background, don't await to send quick response
    startSession(tempId).catch(err => {
        console.error(`Failed to start background session ${tempId}:`, err);
    });

    console.log(`Session ${tempId} triggered, waiting for QR...`);
    let attempts = 0;
    const checkQr = setInterval(async () => {
        attempts++;
        const session = sessions.get(tempId);
        if (session && session.qr) {
            clearInterval(checkQr);
            const url = await QRCode.toDataURL(session.qr);
            if (!res.headersSent) {
                res.json({ success: true, message: 'Scan this QR', sessionId: tempId, qr: session.qr, qrImage: url });
            }
        } else if (attempts > 10) { // 5 seconds timeout
            clearInterval(checkQr);
            if (!res.headersSent) {
                res.json({ success: true, message: 'Session created, waiting for QR...', sessionId: tempId });
            }
        }
    }, 500);
});

// Get QR for specific session (if disconnected/scanning)
app.get('/sessions/:id/qr', async (req, res) => {
    const { id } = req.params;
    const session = sessions.get(id);

    if (!session) {
        return res.status(404).json({ error: 'Session not active' });
    }

    if (session.status === 'connected') {
        return res.json({ status: 'connected', message: 'Session already connected' });
    }

    if (session.qr) {
        const url = await QRCode.toDataURL(session.qr);
        return res.json({ status: 'scan_qr', qr: session.qr, qrImage: url });
    }

    res.json({ status: session.status, message: 'QR not available yet' });
});

// Delete/Logout Session
app.delete('/sessions/:id', async (req, res) => {
    const { id } = req.params;

    console.log(`Request to delete session: ${id}`);

    const session = sessions.get(id);
    if (session && session.sock) {
        try {
            await session.sock.logout();
            console.log('Logout success');
        } catch (e) {
            console.log('Logout failed (socket closed?), forcing delete');
        }
    }

    cleanupSession(id);

    // Delete folder
    const authPath = path.join(BASE_AUTH_FOLDER, id);
    try {
        if (fs.existsSync(authPath)) {
            // Fix permission issue by deleting contents first (just in case)
            try { fs.rmSync(path.join(authPath, '*'), { recursive: true, force: true }); } catch (e) { }
            fs.rmSync(authPath, { recursive: true, force: true });
        }
        res.json({ success: true, message: `Session ${id} deleted` });
    } catch (err) {
        res.status(500).json({ error: `Failed to delete session folder: ${err.message}` });
    }
});

// Send Message
app.post('/send-message', async (req, res) => {
    const { phone, message, sender } = req.body; // sender is optional (phoneNumber)

    if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message required' });
    }

    // Determine which session to use
    let session;
    if (sender) {
        session = sessions.get(sender);
        if (!session) return res.status(404).json({ error: `Sender session ${sender} not found` });
    } else {
        // Use first available connected session
        for (const [id, s] of sessions) {
            if (s.status === 'connected') {
                session = s;
                break;
            }
        }
    }

    if (!session || session.status !== 'connected') {
        return res.status(400).json({ error: 'No connected WhatsApp session available' });
    }

    // Format phone: 0812... -> 62812...
    let formattedPhone = phone.toString();
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.slice(1);
    }
    if (!formattedPhone.endsWith('@s.whatsapp.net')) {
        formattedPhone += '@s.whatsapp.net';
    }

    try {
        await session.sock.sendMessage(formattedPhone, { text: message });
        res.json({ success: true, sender: session.sock.user.id });
    } catch (err) {
        console.error('Failed to send message:', err);
        res.status(500).json({ error: err.message });
    }
});

// Refresh scheduler settings API
app.post('/scheduler/refresh', (req, res) => {
    console.log('[Scheduler] Refresh request received');
    startDatabaseScheduler();
    res.json({ success: true, message: 'Scheduler settings reloaded' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`WhatsApp Multi-Session Bot running on port ${PORT}`);
    initAllSessions();
    startDatabaseScheduler();
});

// Database Path (Relative to src/index.js: ../../web/data/sqlite/hris.db)
const DB_PATH = path.join(__dirname, '../../web/data/sqlite/hris.db');

// Global variable to store current cron task
let currentVacuumTask = null;

function startDatabaseScheduler() {
    // 1. Fetch settings from DB
    let schedule = '0 3 * * *'; // Default: 3 AM
    let enabled = false;

    try {
        if (fs.existsSync(DB_PATH)) {
            const db = new Database(DB_PATH, { readonly: true, timeout: 5000 });
            // Get enabled status
            const enabledRow = db.prepare("SELECT value FROM SystemSetting WHERE key = 'auto_vacuum_enabled'").get();
            if (enabledRow && enabledRow.value === 'true') {
                enabled = true;
            }

            // Get schedule
            const scheduleRow = db.prepare("SELECT value FROM SystemSetting WHERE key = 'auto_vacuum_schedule'").get();
            if (scheduleRow && scheduleRow.value) {
                if (cron.validate(scheduleRow.value)) {
                    schedule = scheduleRow.value;
                } else {
                    console.warn(`[Scheduler] Invalid cron expression '${scheduleRow.value}', using default ${schedule}`);
                }
            }
            db.close();
        }
    } catch (e) {
        console.error('[Scheduler] Failed to read settings:', e.message);
    }

    // 2. Stop existing task
    if (currentVacuumTask) {
        currentVacuumTask.stop();
        currentVacuumTask = null;
    }

    // 3. Start new task if enabled
    if (enabled) {
        console.log(`[Scheduler] Scheduling Database VACUUM at '${schedule}'`);
        currentVacuumTask = cron.schedule(schedule, () => {
            console.log('[Scheduler] Executing scheduled VACUUM...');
            try {
                if (fs.existsSync(DB_PATH)) {
                    const db = new Database(DB_PATH, { timeout: 5000 });
                    const start = Date.now();
                    db.exec('VACUUM');
                    db.close();
                    console.log(`[Scheduler] VACUUM completed in ${Date.now() - start}ms`);
                }
            } catch (err) {
                console.error('[Scheduler] VACUUM execution failed:', err);
            }
        });
    } else {
        console.log('[Scheduler] Database VACUUM is DISABLED in settings');
    }
}
