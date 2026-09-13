'use strict';

/*
 * MADARA X-MD — session themes.
 *
 * Loads flavor text (greetings, success/wait/owner/dev messages, etc.)
 * from the real themes/<name>.json files. botName/botBrand/footer are
 * deliberately NOT taken from the theme file — they always come from
 * settings.js, so switching themes changes the bot's personality/flavor
 * text without silently renaming the bot away from whatever the owner
 * actually configured. A theme is a skin, not a rebrand.
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');
const settings = require('../settings');
const { toSmallCaps } = require('./smallcaps');

const NAMES = ['madara', 'naruto', 'akatsuki', 'sharingan', 'itachi'];

const THEMES_DIR = path.join(__dirname, '..', 'themes');
const _cache = new Map();

function loadFromDisk(name) {
    if (_cache.has(name)) return _cache.get(name);

    let theme = null;
    try {
        const raw = fs.readFileSync(path.join(THEMES_DIR, `${name}.json`), 'utf8');
        theme = JSON.parse(raw);
    } catch (e) {
        console.error(`[sessionTheme] Failed to load themes/${name}.json:`, e.message);
        theme = null;
    }

    if (theme?.STRINGS?.global) {
        // Identity fields ALWAYS come from settings.js, never from the
        // theme file — a theme changes flavor text, not who the bot is.
        theme.STRINGS.global.botName  = settings.botName;
        theme.STRINGS.global.botBrand = settings.botBrand;
        theme.STRINGS.global.footer   = (settings.footer || '')
            .replace(/^\n?>?\s*\*?/, '').replace(/\*?$/, ''); // strip footer()'s own wrapping, added back below
    }

    _cache.set(name, theme);
    return theme;
}

const DESCRIPTIONS = {
    madara: 'ᴡᴀᴋᴇ ᴜᴘ ᴛᴏ ʀᴇᴀʟɪᴛʏ',
    naruto: 'ᴡɪʟʟ ᴏғ ғɪʀᴇ',
    akatsuki: 'sʜᴀᴅᴏᴡs ɪɴ sɪʟᴇɴᴄᴇ',
    sharingan: 'ᴛʜᴇ ᴇʏᴇ ᴡᴀᴛᴄʜᴇs',
    itachi: 'ᴛʜᴇ ᴛʀᴜᴛʜ ɪɴ sʜᴀᴅᴏᴡs'
};

function normalise(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function load(name) {
    const n = normalise(name);
    return NAMES.includes(n) ? loadFromDisk(n) : null;
}

function get(phone) {
    const selected = db.getSession(phone, 'config', 'theme', '');
    return load(selected);
}

async function set(phone, name) {
    const n = normalise(name);
    const theme = load(n);
    if (!theme || !phone) return null;

    db.setSession(phone, 'config', 'theme', n);
    await db.flushDirty();
    clearPending(phone);
    return theme;
}

function info(phone) {
    return get(phone)?.STRINGS?.global || null;
}

function string(phone, key, fallback = '') {
    return info(phone)?.[key] || fallback;
}

function footer(phone) {
    const value = string(phone, 'footer', '');
    return value ? `\n> *${value}*` : '';
}

function format(phone, text) {
    return typeof text === 'string' ? toSmallCaps(text) : text;
}

function selectionFromMessage(msg) {
    const interactive = msg?.message?.interactiveResponseMessage;
    const buttons =
        msg?.message?.buttonsResponseMessage ||
        msg?.message?.templateButtonReplyMessage;

    let params = {};
    try {
        const raw = interactive?.nativeFlowResponseMessage?.paramsJson;
        if (raw) params = JSON.parse(raw);
    } catch {}

    return (
        params.id ||
        params.selectedId ||
        buttons?.selectedButtonId ||
        buttons?.selectedId ||
        buttons?.selectedDisplayText ||
        msg?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
        ''
    );
}

function selectionName(value) {
    const raw = String(value || '').trim().toLowerCase();

    const idName = raw.startsWith('madara_theme_')
        ? raw.slice('madara_theme_'.length)
        : raw;

    const map = {
        '1': 'madara',
        '2': 'naruto',
        '3': 'akatsuki',
        '4': 'sharingan',
        '5': 'itachi'
    };

    const name = map[idName] || normalise(idName);
    return NAMES.includes(name) ? name : null;
}

function promptText() {
    return (
        '🎨 *ᴄʜᴏᴏsᴇ ʏᴏᴜʀ ᴍᴀᴅᴀʀᴀ ᴛʜᴇᴍᴇ*\n\n' +
        NAMES
            .map((name, i) =>
                `${i + 1}. *${name.toUpperCase()}* — ${DESCRIPTIONS[name]}`
            )
            .join('\n') +
        '\n\nʀᴇᴘʟʏ ᴡɪᴛʜ ᴀ ɴᴜᴍʙᴇʀ ᴏʀ ᴛʜᴇᴍᴇ ɴᴀᴍᴇ.'
    );
}

// ── Cross-reconnect pending-prompt guard ─────────────────────────────
// sock._themePromptSent (used by pairManager.js) only protects against
// duplicate sends within ONE socket instance — it resets to undefined on
// every reconnect, since each reconnect creates a brand new sock object.
// This is the persistent, per-phone guard that survives across
// reconnects: once a prompt is sent, isPending() stays true until the
// user actually picks a theme (or a safety timeout elapses), so rapid
// reconnects during pairing can't each independently re-trigger the
// prompt.
const pendingByPhone = new Map(); // phone -> timestamp prompt was sent

function isPending(phone) {
    const ts = pendingByPhone.get(phone);
    if (!ts) return false;
    // Safety timeout — don't let a stuck flag silently block the prompt
    // forever if something went wrong and no reply ever arrived.
    if (Date.now() - ts > 90 * 1000) {
        pendingByPhone.delete(phone);
        return false;
    }
    return true;
}

function markPending(phone) {
    if (phone) pendingByPhone.set(phone, Date.now());
}

function clearPending(phone) {
    pendingByPhone.delete(phone);
}

// ── Self-chat echo guard ─────────────────────────────────────────────
// In "Message yourself" (the owner's own self-chat), EVERY message —
// whether typed by the human on their phone or sent automatically by
// the bot — comes back through messages.upsert as fromMe:true. There is
// no way to tell them apart by content or sender alone. Instead, tag
// each sent prompt with its own real message ID, and recognize that
// exact ID coming back as the bot hearing its own echo, not a reply.
const pendingPromptIds = new Set();

function isThemePromptMessage(sock, msg) {
    const id = msg?.key?.id;
    if (!id || !pendingPromptIds.has(id)) return false;
    pendingPromptIds.delete(id); // consume once — only the one echo needs skipping
    return true;
}

async function themePrompt(c) {
    /*
     * Deliberately use plain text in the test bot.
     * This removes the optional baileysHelper/native-flow dependency.
     * The handler already understands ordinary text replies.
     */
    markPending(c?.sessionPhone);
    const sent = await c.reply(toSmallCaps(promptText()));
    const id = sent?.key?.id;
    if (id) {
        pendingPromptIds.add(id);
        // Safety net only — this ID should be consumed within one
        // round-trip; don't let it linger forever if something else
        // goes wrong.
        setTimeout(() => pendingPromptIds.delete(id), 5 * 60 * 1000).unref?.();
    }
    return sent;
}

async function applySelection(c, name) {
    const theme = await set(c.sessionPhone, name);
    if (!theme) return false;

    await c.reply(toSmallCaps(
        `✅ *ᴛʜᴇᴍᴇ sᴇᴛ:* ${theme.STRINGS.global.botName}\n\n` +
        'ᴛʜᴇ ᴛʜᴇᴍᴇ ɪs ɴᴏᴡ ᴀᴄᴛɪᴠᴇ ғᴏʀ ᴛʜɪs sᴇssɪᴏɴ.\n\n' +
        'ᴛʀʏ .menu ɴᴏᴡ.'
    ));

    return true;
}

async function handlePendingText(sock, msg, c) {
    if (!c?.isSessionOwnerChat) return false;

    /*
     * Do not reject a message merely because it starts with ".".
     * Theme selection is resolved first by the handler, while ordinary
     * commands continue through the normal command router.
     */
    const selected = selectionName(
        selectionFromMessage(msg) || c.body
    );

    if (!selected) return false;
    return applySelection(c, selected);
}

async function enforce(sock, msg, c) {
    if (!c?.isSessionOwnerChat) return false;

    const theme = get(c.sessionPhone);

    if (!theme) {
        /*
         * Only the owner's self-chat is gated.
         * The .menu command itself is allowed to trigger this prompt.
         */
        await themePrompt(c);
        return true;
    }

    return false;
}

function list() {
    return NAMES.slice();
}

module.exports = {
    NAMES,
    load,
    get,
    set,
    footer,
    format,
    themePrompt,
    handlePendingText,
    enforce,
    isThemePromptMessage,
    isPending,
    markPending,
    clearPending,
    list,
    info,
    string
};
