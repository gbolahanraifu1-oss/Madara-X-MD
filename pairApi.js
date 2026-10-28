// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  Web Pairing API (FIXED RE-PAIR)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

'use strict';

const http = require('http');
const url  = require('url');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || process.env.WEB_PORT || 24922, 10);

const _pending  = new Map();
const _warming  = new Map();

const { activeSessions, getPairingCode, hasRegisteredCredentials } = require('./lib/pairManager');
const maintenance = require('./lib/maintenance');

let _getOrCreateSock = null;
let _clearSession    = null;

function isSessionClearAuthorized(req) {
    const expected = process.env.SESSION_CLEAR_TOKEN || '';
    if (!expected) return { configured: false, authorized: false };
    const supplied = String(req.headers['x-session-clear-token'] || '');
    const expectedBytes = Buffer.from(expected);
    const suppliedBytes = Buffer.from(supplied);
    return { configured: true, authorized: expectedBytes.length === suppliedBytes.length && crypto.timingSafeEqual(expectedBytes, suppliedBytes) };
}

function setCors(res, methods = 'GET, POST, OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Clear-Token');
    res.setHeader('Content-Type', 'application/json');
}

function readBody(req) {
    return new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end',  ()    => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
    });
}

async function handleRequest(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const parsed   = url.parse(req.url, true);
    const pathname = parsed.pathname;

    if (pathname === '/' || pathname === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), port: PORT }));
        return;
    }

    if (pathname === '/ping') {
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, ts: Date.now() }));
        return;
    }

    if (pathname === '/warm' && req.method === 'POST') {
        if (maintenance.isOn()) {
            res.writeHead(503);
            res.end(JSON.stringify({ error: 'Pairing is temporarily disabled for maintenance.' }));
            return;
        }
        const body  = await readBody(req);
        const phone = String(body.phone || '').replace(/[^0-9]/g, '');
        if (!phone || phone.length < 7 || phone.length > 15) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid phone number' }));
            return;
        }
        if (!_warming.has(phone)) {
            console.log(`[WebPair] 🔥 Warming +${phone}`);
            const p = _getOrCreateSock(phone, false).catch(() => null);
            _warming.set(phone, p);
            setTimeout(() => _warming.delete(phone), 90_000);
        }
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, phone }));
        return;
    }

    if (pathname === '/session/clear' && req.method === 'POST') {
        const clearAuth = isSessionClearAuthorized(req);
        if (!clearAuth.configured) {
            res.writeHead(503);
            res.end(JSON.stringify({ error: 'Session clearing is disabled. Configure SESSION_CLEAR_TOKEN or use the owner-only Telegram unpair command.' }));
            return;
        }
        if (!clearAuth.authorized) {
            res.writeHead(403);
            res.end(JSON.stringify({ error: 'Invalid session-clear authorization.' }));
            return;
        }
        const body  = await readBody(req);
        const phone = String(body.phone || parsed.query.phone || '').replace(/[^0-9]/g, '');
        if (!phone || phone.length < 7 || phone.length > 15) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'phone required — e.g. { "phone": "2347062301699" }' }));
            return;
        }
        _pending.delete(phone);
        _warming.delete(phone);
        try {
            const cleared = await _clearSession(phone);
            console.log(`[WebPair] 🗑️  Session cleared for +${phone}`);
            res.writeHead(200);
            res.end(JSON.stringify({ ok: true, phone, message: `Session cleared. GET /pair?phone=${phone} to re-pair.`, hadSession: cleared }));
        } catch (e) {
            console.error(`[WebPair] clear error for +${phone}:`, e.message);
            res.writeHead(500);
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    if (pathname === '/status' && req.method === 'GET') {
        const phone = String(parsed.query.phone || '').replace(/[^0-9]/g, '');
        if (!phone || phone.length < 7 || phone.length > 15) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid phone number' }));
            return;
        }
        const mode = String(parsed.query.mode || 'custom').toLowerCase();
        if (!['normal', 'custom'].includes(mode)) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid pairing mode. Use normal or custom.' }));
            return;
        }
        const session = activeSessions.get(phone);
        res.writeHead(200);
        res.end(JSON.stringify({ connected: Boolean(session?.connected), phone }));
        return;
    }

    // ── GET /pair?phone=… — FIXED: always delete old creds for fresh code ──
    if (pathname === '/pair' && req.method === 'GET') {
        if (maintenance.isOn()) {
            res.writeHead(503);
            res.end(JSON.stringify({ error: 'Pairing is temporarily disabled for maintenance.', reason: maintenance.reason() || undefined }));
            return;
        }

        const phone = String(parsed.query.phone || '').replace(/[^0-9]/g, '');
        if (!phone || phone.length < 7 || phone.length > 15) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid number. Use international format: 2347062301699' }));
            return;
        }

        const mode = String(parsed.query.mode || 'custom').toLowerCase();
        if (!['normal', 'custom'].includes(mode)) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid pairing mode. Use normal or custom.' }));
            return;
        }

        // Never destroy an existing session just to issue another pairing code.
        // Reuse unregistered sockets; registered sessions reconnect via /warm.
        if (_pending.has(phone)) {
            res.writeHead(409);
            res.end(JSON.stringify({ error: 'A pairing request is already running for this number.', phone }));
            return;
        }
        const currentSession = activeSessions.get(phone);
        if (currentSession?.connected || currentSession?.registered || currentSession?.sock?.user?.id || hasRegisteredCredentials(phone)) {
            res.writeHead(409);
            res.end(JSON.stringify({ error: 'This number already has a linked WhatsApp session. Use /warm to reconnect; unlink it explicitly before pairing again.', phone, connected: Boolean(currentSession?.connected) }));
            return;
        }

        console.log(`[WebPair] 📲 Pair requested for +${phone} (mode: ${mode})`);
        const started = Date.now();

        let responded = false;
        const httpTimer = setTimeout(() => {
            if (!responded) {
                responded = true;
                _pending.delete(phone);
                res.writeHead(504);
                res.end(JSON.stringify({ error: 'Pairing timed out. Existing session credentials were not cleared; retry when the connection is stable.' }));
            }
        }, 70_000);

        try {
            const sockPromise = _warming.has(phone) ? _warming.get(phone) : _getOrCreateSock(phone, false);
            _warming.delete(phone);

            _pending.set(phone, true);
            const sock = await sockPromise;
            if (!sock) throw new Error('Could not start session');

            const code      = await getPairingCode(sock, phone, mode);
            const formatted = String(code).toUpperCase();
            const ms        = Date.now() - started;
            console.log(`[WebPair] ✅ Code for +${phone}: ${formatted} (${ms} ms, mode: ${mode})`);

            _pending.delete(phone);
            if (!responded) {
                responded = true;
                clearTimeout(httpTimer);
                res.writeHead(200);
                res.end(JSON.stringify({ code: formatted, phone, mode, ms }));
            }
        } catch (err) {
            _pending.delete(phone);
            console.error(`[WebPair] ❌ +${phone}:`, err.message);
            if (!responded) {
                responded = true;
                clearTimeout(httpTimer);
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message, hint: 'Existing session credentials were preserved. Only use an owner-authorized unpair action if you intend to unlink.' }));
            }
        }
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
}

function startSelfPing(port) {
    const INTERVAL = 4 * 60 * 1000;
    setInterval(() => {
        const req = http.get(`http://127.0.0.1:${port}/ping`, res => { res.resume(); });
        req.on('error', () => {});
        req.setTimeout(10_000, () => req.destroy());
    }, INTERVAL);
}

function init(getOrCreateSock, clearSession) {
    _getOrCreateSock = getOrCreateSock;
    _clearSession    = clearSession;

    const server = http.createServer(handleRequest);
    server.keepAliveTimeout = 120_000;
    server.headersTimeout   = 125_000;

    server.listen(PORT, '0.0.0.0', () => {
        const botUrl = process.env.BOT_URL || `http://0.0.0.0:${PORT}`;
        console.log(`🌐 [WebPair PRO] API on port ${PORT} — ${botUrl}`);
        console.log(`   GET  /pair?phone=<number>&mode=custom|normal`);
        console.log(`   POST /session/clear  { "phone": "<number>" }`);
        console.log(`   GET  /ping   (keep-alive probe)`);
        console.log(`   GET  /health`);
        setTimeout(() => startSelfPing(PORT), 5000);
    });

    server.on('error', e => console.error('[WebPair]', e.message));
    return server;
}

module.exports = { init };