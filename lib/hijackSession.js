// language: JavaScript, file: lib/hijackSession.js
'use strict';

const fs     = require('fs');
const path   = require('path');

const ROOT = path.join(process.cwd(), 'hijack_sessions');

const _pendingPairing = new Map();

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

// ──────────────────────────────────────────────────────────────────
// hasCreds — MUST parse creds.json and check registered === true.
// a file existing is not a pair. registered:true is a pair.
// ──────────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────────
// wipeTarget — nukes a target's auth dir. used before re-pairing
// or via --force when the pairing is broken/stale.
// ──────────────────────────────────────────────────────────────────
function wipeTarget(scope, phone) {
    const dir = targetDir(scope, phone);
    if (fs.existsSync(dir)) {
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    }
}

function getBaileys() {
    const c = ['@pasqua-baileys/baileys','@itsliaaa/baileys','@whiskeysockets/baileys','@adiwajshing/baileys'];
    for (const p of c) { try { return require(p); } catch {} }
    return null;
}

// ──────────────────────────────────────────────────────────────────
// pairHijackSession — boot socket, request code, keep alive 60s
// auto-closes on timeout so next attempt is clean
// ──────────────────────────────────────────────────────────────────
async function pairHijackSession(scope, targetPhone) {
    const cleanPhone = String(targetPhone).replace(/\D/g, '');
    if (!cleanPhone) throw new Error('targetPhone required');

    const dir = targetDir(scope, cleanPhone);
    ensureDir(dir);

    const baileys = getBaileys();
    if (!baileys) throw new Error('baileys missing');

    const {
        default: makeWASocket,
        useMultiFileAuthState,
        fetchLatestBaileysVersion,
        Browsers,
    } = baileys;

    const { state, saveCreds } = await useMultiFileAuthState(dir);

    if (state.creds.registered) {
        throw new Error('already registered — use --force to reset');
    }

    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));

    const sock = makeWASocket({
        version,
        auth: state,
        browser: Browsers?.ubuntu?.('Chrome') || ['Ubuntu', 'Chrome', '120.0.0'],
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
    });

    sock.ev.on('creds.update', saveCreds);

    const key = `${scope}:${cleanPhone}`;
    let opened = false;

    sock.ev.on('connection.update', (u) => {
        if (u.connection === 'open') {
            opened = true;
            _pendingPairing.delete(key);
            setTimeout(() => { try { sock.end(undefined); } catch {} }, 1000);
        }
        if (u.connection === 'close') {
            _pendingPairing.delete(key);
        }
    });

    // 60s self-destruct — if code isn't entered, close cleanly.
    // leave the creds.json on disk (unregistered) so next pairing overwrites.
    setTimeout(() => {
        if (!opened && _pendingPairing.has(key)) {
            _pendingPairing.delete(key);
            try { sock.end(undefined); } catch {}
        }
    }, 60000);

    const code = await sock.requestPairingCode(cleanPhone);
    _pendingPairing.set(key, sock);

    return { code, sock };
}

async function bootHijackSession(scope, targetPhone) {
    const phone = String(targetPhone).replace(/\D/g, '');
    if (!phone) throw new Error('targetPhone required');
    const dir  = targetDir(scope, phone);
    const file = path.join(dir, 'creds.json');
    if (!fs.existsSync(file)) throw new Error(`no creds for ${phone}`);

    const baileys = getBaileys();
    if (!baileys) throw new Error('baileys missing');

    const {
        default: makeWASocket,
        useMultiFileAuthState,
        fetchLatestBaileysVersion,
        Browsers,
    } = baileys;

    const { state, saveCreds } = await useMultiFileAuthState(dir);
    if (!state.creds.registered) throw new Error(`creds for ${phone} not registered`);

    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));

    const sock = makeWASocket({
        version,
        auth: state,
        browser: Browsers?.ubuntu?.('Chrome') || ['Ubuntu', 'Chrome', '120.0.0'],
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
    });

    sock.ev.on('creds.update', saveCreds);

    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('hijack socket open timeout')), 30000);
        sock.ev.on('connection.update', (u) => {
            if (u.connection === 'open') { clearTimeout(timer); resolve(); }
            if (u.connection === 'close') { clearTimeout(timer); reject(new Error('hijack socket closed')); }
        });
    });

    return sock;
}

function closePendingPairing(scope, phone) {
    const key = `${scope}:${String(phone).replace(/\D/g, '')}`;
    const sock = _pendingPairing.get(key);
    if (sock) {
        try { sock.end(undefined); } catch {}
        _pendingPairing.delete(key);
    }
}

module.exports = {
    readTargets, addTarget, hasCreds, wipeTarget,
    pairHijackSession, bootHijackSession,
    closePendingPairing, scopeDir, targetDir,
};