// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Database (Fast + Leak-proof)       ║
// ║   • Async debounced writes — never blocks handler  ║
// ║   • Bounded LRU cache — safe for 20+ day uptime   ║
// ║   • Dirty-flag batching — minimal I/O             ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR   = path.join(process.cwd(), 'data');
const MAX_CACHE  = 120;   // max entries in shared cache
const FLUSH_MS   = 8000;  // flush dirty entries every 8s

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── LRU-bounded in-memory cache ────────────────────────────────────────────
const _cache    = new Map(); // key → data
const _dirty    = new Set(); // keys that need flushing
const _accessTs = new Map(); // key → last access time (for LRU eviction)

function _touch(key)       { _accessTs.set(key, Date.now()); }
function _markDirty(key)   { _dirty.add(key); }

function _evictIfNeeded() {
    if (_cache.size <= MAX_CACHE) return;
    // Evict the oldest-accessed CLEAN entries first
    const entries = [..._accessTs.entries()]
        .filter(([k]) => !_dirty.has(k))
        .sort((a, b) => a[1] - b[1]);
    const toEvict = _cache.size - MAX_CACHE + 10; // evict 10 extra for headroom
    entries.slice(0, toEvict).forEach(([k]) => {
        _cache.delete(k);
        _accessTs.delete(k);
    });
}

// ── Path helpers ───────────────────────────────────────────────────────────
function getPath(name)             { return path.join(DATA_DIR, `${name}.json`); }
function getSessionPath(phone, name) {
    const dir = path.join(process.cwd(), 'sessions', phone, 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `${name}.json`);
}

// ── Shared store ───────────────────────────────────────────────────────────
function read(name) {
    if (_cache.has(name)) { _touch(name); return _cache.get(name); }
    try {
        const p    = getPath(name);
        const data = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
        _cache.set(name, data);
        _touch(name);
        _evictIfNeeded();
        return data;
    } catch { return {}; }
}

function write(name, data) {
    _cache.set(name, data);
    _touch(name);
    _markDirty(name);
    _evictIfNeeded();
}

function get(name, key, def = null)   { return read(name)[key] ?? def; }
function set(name, key, value)        { const d = read(name); d[key] = value; write(name, d); }
function del(name, key)               { const d = read(name); delete d[key]; write(name, d); }

// ── Group helpers ──────────────────────────────────────────────────────────
function getGroup(gid)               { return read('groups')[gid] || {}; }
function setGroup(gid, data)         { const all = read('groups'); all[gid] = { ...(all[gid] || {}), ...data }; write('groups', all); }
function getGroupSetting(gid, k, d)  { return getGroup(gid)[k] ?? d; }
function setGroupSetting(gid, k, v)  { setGroup(gid, { [k]: v }); }

// ── Session store ──────────────────────────────────────────────────────────
function _sessionKey(phone, name) { return `session:${phone}:${name}`; }

function readSession(phone, name) {
    const ck = _sessionKey(phone, name);
    if (_cache.has(ck)) { _touch(ck); return _cache.get(ck); }
    try {
        const p    = getSessionPath(phone, name);
        const data = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
        _cache.set(ck, data);
        _touch(ck);
        _evictIfNeeded();
        return data;
    } catch { return {}; }
}

function writeSession(phone, name, data) {
    const ck = _sessionKey(phone, name);
    _cache.set(ck, data);
    _touch(ck);
    _markDirty(ck);
    _evictIfNeeded();
}

function getSession(phone, name, key, def = null) { if (!phone) return def; return readSession(phone, name)[key] ?? def; }
function setSession(phone, name, key, value)       { if (!phone) return; const d = readSession(phone, name); d[key] = value; writeSession(phone, name, d); }
function delSession(phone, name, key)              { if (!phone) return; const d = readSession(phone, name); delete d[key]; writeSession(phone, name, d); }

// ── Async flush (never blocks the event loop) ──────────────────────────────
async function flushDirty() {
    if (!_dirty.size) return;
    const toFlush = [..._dirty];
    _dirty.clear(); // clear first so new writes during flush are captured next round
    for (const key of toFlush) {
        const data = _cache.get(key);
        if (data === undefined) continue;
        try {
            if (key.startsWith('session:')) {
                const parts = key.split(':');
                const phone = parts[1];
                const name  = parts.slice(2).join(':');
                await fs.promises.writeFile(getSessionPath(phone, name), JSON.stringify(data), 'utf8');
            } else {
                await fs.promises.writeFile(getPath(key), JSON.stringify(data), 'utf8');
            }
        } catch (e) {
            // Re-mark dirty so it retries next flush
            _dirty.add(key);
            if (!e.message?.includes('ENOENT')) console.error('[DB] flush error:', e.message);
        }
    }
}

// Flush every 8s — async, never blocks message handling
const _flushTimer = setInterval(flushDirty, FLUSH_MS);
if (_flushTimer.unref) _flushTimer.unref(); // don't keep process alive just for this

// ── Clean shutdown — flush before exit ────────────────────────────────────
async function shutdown() {
    clearInterval(_flushTimer);
    await flushDirty();
}
process.once('SIGINT',  () => shutdown().then(() => process.exit(0)));
process.once('SIGTERM', () => shutdown().then(() => process.exit(0)));

module.exports = {
    read, write, get, set, del,
    getGroup, setGroup, getGroupSetting, setGroupSetting,
    readSession, writeSession, getSession, setSession, delSession,
    flushDirty, shutdown,
};
