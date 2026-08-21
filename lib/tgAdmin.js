// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Telegram Admin/Ban Registry           ║
// ║   Tracks admins added via /addadmin (on top of the    ║
// ║   fixed ADMIN_ID env list) and banned Telegram users.  ║
// ║   Persisted to disk so it survives restarts.           ║
// ╚══════════════════════════════════════════════════════╝

'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'tg-admin-state.json');

function load() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            return {
                admins: Array.isArray(raw.admins) ? raw.admins.map(String) : [],
                banned: Array.isArray(raw.banned) ? raw.banned.map(String) : [],
            };
        }
    } catch (e) {
        console.error('[TgAdmin] load error:', e.message);
    }
    return { admins: [], banned: [] };
}

function persist() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify({
            admins: [...admins],
            banned: [...banned],
        }, null, 2));
    } catch (e) {
        console.error('[TgAdmin] save error:', e.message);
    }
}

const _initial = load();
const admins   = new Set(_initial.admins);
const banned   = new Set(_initial.banned);

module.exports = {
    // ── Dynamic admins (added/removed via /addadmin & /removeadmin) ──────
    isDynamicAdmin(id)  { return admins.has(String(id)); },
    addAdmin(id)        { const added = !admins.has(String(id)); admins.add(String(id)); persist(); return added; },
    removeAdmin(id)     { const removed = admins.delete(String(id)); if (removed) persist(); return removed; },
    listAdmins()        { return [...admins]; },

    // ── Banned Telegram users ─────────────────────────────────────────────
    isBannedRaw(id)      { return banned.has(String(id)); },
    ban(id)              { const added = !banned.has(String(id)); banned.add(String(id)); persist(); return added; },
    unban(id)            { const removed = banned.delete(String(id)); if (removed) persist(); return removed; },
    listBanned()         { return [...banned]; },
};
