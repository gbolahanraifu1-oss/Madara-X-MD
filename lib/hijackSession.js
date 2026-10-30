// language: JavaScript, file: lib/hijackSession.js
'use strict';

const fs     = require('fs');
const path   = require('path');
const pino   = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
} = require('@itsliaaa/baileys');

const ROOT = path.join(process.cwd(), 'hijack_sessions');
const activeHijackSessions = new Map();

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
// startHijackSession — adapted from your pairManager logic
// ──────────────────────────────────────────────────────────────────
async function startHijackSession(scope, phone, forceNew = false) {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const dir = targetDir(scope, cleanPhone);
    const sessionKey = `${scope}:${cleanPhone}`;

    // 1. Reuse if already active and registered
    if (!forceNew && activeHijackSessions.has(sessionKey)) {
        const existing = activeHijackSessions.get(sessionKey);
        if (existing.sock && hasCreds(scope, cleanPhone)) return existing.sock;
    }

    // 2. Clear broken/abandoned sessions
    if (forceNew || activeHijackSessions.has(sessionKey)) {
        const old = activeHijackSessions.get(sessionKey);
        if (old?.sock) { try { old.sock.end(); } catch {} }
        activeHijackSessions.delete(sessionKey);
    }

    ensureDir(dir);
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

    activeHijackSessions.set(sessionKey, { sock, registered: Boolean(state.creds?.registered) });
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
            const session = activeHijackSessions.get(sessionKey);
            if (session) {
                session.registered = true;
                activeHijackSessions.set(sessionKey, session);
            }
        }
        
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            
            // 515 = restart required after pairing — reconnect
            if (code === 515) {
                console.log(`[hijack:${cleanPhone}] 515 restart required`);
                setTimeout(() => {
                    startHijackSession(scope, cleanPhone, true).catch(() => {});
                }, 3000);
                return;
            }

            const isRealLogout = code === DisconnectReason.loggedOut || code === 401;
            if (isRealLogout) {
                if (!sock._pairingInProgress) {
                    activeHijackSessions.delete(sessionKey);
                    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
                }
            }
        }
    });

    return sock;
}

async function bootHijackSession(scope, targetPhone) {
    const phone = String(targetPhone).replace(/\D/g, '');
    if (!phone) throw new Error('targetPhone required');
    const sessionKey = `${scope}:${phone}`;

    // Check active memory first
    if (activeHijackSessions.has(sessionKey)) {
        const existing = activeHijackSessions.get(sessionKey);
        if (existing.sock && existing.registered) return existing.sock;
    }

    // Otherwise boot from disk
    const dir = targetDir(scope, phone);
    const file = path.join(dir, 'creds.json');
    if (!fs.existsSync(file)) throw new Error(`no creds for ${phone}`);

    const { state } = await useMultiFileAuthState(dir);
    if (!state.creds.registered) throw new Error(`creds for ${phone} not registered`);

    const sock = await startHijackSession(scope, phone, false);

    // Wait for open
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('hijack socket open timeout')), 30000);
        sock.ev.on('connection.update', (u) => {
            if (u.connection === 'open') { clearTimeout(timer); resolve(); }
            if (u.connection === 'close') { clearTimeout(timer); reject(new Error('hijack socket closed')); }
        });
    });

    return sock;
}

module.exports = {
    readTargets, addTarget, hasCreds, wipeTarget,
    startHijackSession, bootHijackSession,
    getHijackPairingCode,
    scopeDir, targetDir,
};