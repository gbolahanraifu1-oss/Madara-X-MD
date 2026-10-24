// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  Web Pairing API (FIXED RE-PAIR)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

'use strict';

const http = require('http');
const url  = require('url');

const PORT = parseInt(process.env.PORT || process.env.WEB_PORT || 24922, 10);

const _pending  = new Map();
const _warming  = new Map();

const { activeSessions, getPairingCode } = require('./lib/pairManager');
const maintenance = require('./lib/maintenance');

let _getOrCreateSock = null;
let _clearSession    = null;

function setCors(res, methods = 'GET, POST, OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
            const p = _getOrCreateSock(phone, true).catch(() => null);
            _warming.set(phone, p);
            setTimeout(() => _warming.delete(phone), 90_000);
        }
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, phone }));
        return;
    }

    if (pathname === '/session/clear' && req.method === 'POST') {
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

        // FIX: If same number requested again, delete existing creds and generate new
        if (_pending.has(phone) || activeSessions.has(phone)) {
            console.log(`[WebPair] ♻️  Re-pair for +${phone} — clearing old session`);
            _pending.delete(phone);
            _warming.delete(phone);
            try { await _clearSession(phone); } catch {}
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log(`[WebPair] 📲 Pair requested for +${phone} (mode: ${mode})`);
        const started = Date.now();

        let responded = false;
        const httpTimer = setTimeout(() => {
            if (!responded) {
                responded = true;
                _pending.delete(phone);
                res.writeHead(504);
                res.end(JSON.stringify({ error: 'Gateway timeout — bot did not receive a QR in time. Try again.', hint: `POST /session/clear { "phone": "${phone}" } then retry.` }));
            }
        }, 70_000);

        try {
            const sockPromise = _warming.has(phone) ? _warming.get(phone) : _getOrCreateSock(phone, true);
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
                res.end(JSON.stringify({ error: err.message, hint: `POST /session/clear { "phone": "${phone}" } then retry.` }));
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