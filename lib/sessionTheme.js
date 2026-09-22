'use strict';

/*
 * MADARA X-MD — session themes.
 *
 * Loads flavor text from themes/<name>.json files. botName/botBrand/footer
 * come from settings.js, never the theme file — a theme is a skin.
 *
 * Prompt gating: the theme prompt fires ONCE per pair. Selection is
 * consumed only while a live prompt window is open (isPending).
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
        theme.STRINGS.global.botName  = settings.botName;
        theme.STRINGS.global.botBrand = settings.botBrand;
        theme.STRINGS.global.footer   = (settings.footer || '')
            .replace(/^\n?>?\s*\*?/, '').replace(/\*?$/, '');
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
    return String(name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
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
    db.setSession(phone, 'config', 'themePrompted', false);
    clearPending(phone);
    await db.flushDirty();
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

/* ── Persistent per-phone prompt flag ────────────────────────────────
 * One-shot pair guard. Set the moment the pair prompt goes out; cleared
 * by set() when the user picks a theme, or by .theme list to force a
 * new prompt.
 * ────────────────────────────────────────────────────────────────── */
function hasBeenPrompted(phone) {
    if (!phone) return false;
    return db.getSession(phone, 'config', 'themePrompted', false) === true;
}

function markPrompted(phone) {
    if (!phone) return;
    db.setSession(phone, 'config', 'themePrompted', true);
    db.flushDirty?.().catch?.(() => {});
}

function clearPrompted(phone) {
    if (!phone) return;
    db.setSession(phone, 'config', 'themePrompted', false);
    db.flushDirty?.().catch?.(() => {});
}

/* ── Live pending window ─────────────────────────────────────────────
 * Timestamped. The text router below reads this — a live, expiring
 * window, not the persistent pair flag. Auto-expires after 5 min.
 * ────────────────────────────────────────────────────────────────── */
const pendingByPhone = new Map();
const PENDING_WINDOW_MS = 5 * 60 * 1000;

function pendingKey(c) {
    return c?.sessionPhone
        || c?.sender
        || c?.from
        || c?.sock?.user?.id
        || '';
}

function isPending(phone) {
    const key = typeof phone === 'object' ? pendingKey(phone) : phone;
    if (!key) return false;
    const ts = pendingByPhone.get(key);
    if (!ts) return false;
    if (Date.now() - ts > PENDING_WINDOW_MS) {
        pendingByPhone.delete(key);
        return false;
    }
    return true;
}

function markPending(phone) {
    const key = typeof phone === 'object' ? pendingKey(phone) : phone;
    if (key) pendingByPhone.set(key, Date.now());
}

function clearPending(phone) {
    const key = typeof phone === 'object' ? pendingKey(phone) : phone;
    if (key) pendingByPhone.delete(key);
}

/* ── Self-chat echo guard ────────────────────────────────────────────
 * In the owner's self-chat, every message — typed or bot-sent — returns
 * as fromMe:true. Tag each prompt with its own message ID and recognize
 * that exact ID as the bot hearing its own echo.
 * ────────────────────────────────────────────────────────────────── */
const pendingPromptIds = new Set();

function isThemePromptMessage(sock, msg) {
    const id = msg?.key?.id;
    if (!id || !pendingPromptIds.has(id)) return false;
    pendingPromptIds.delete(id);
    return true;
}

/* ── Send the prompt. Persistent pair gate + fast in-process gate. ── */
async function themePrompt(c) {
    const key = pendingKey(c);
    if (!key) return null;

    if (hasBeenPrompted(key)) return null;
    if (isPending(key)) return null;

    markPrompted(key);
    markPending(key);

    const sent = await c.reply(toSmallCaps(promptText()));

    const id = sent?.key?.id;
    if (id) {
        pendingPromptIds.add(id);
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

/* ── Text router for theme selection ─────────────────────────────────
 * Gate: isPending(phone) — a live, 5-minute window opened by
 * themePrompt(). Once the window is closed (expired, cleared by set(),
 * or never opened), bare 1–5 fall through to the dating router and
 * every other pending flow.
 * ────────────────────────────────────────────────────────────────── */
async function handlePendingText(sock, msg, c) {
    if (!c?.isSessionOwnerChat) return false;

    const phone = c.sessionPhone || c.sender || '';
    if (!isPending(phone)) return false;

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
    hasBeenPrompted,
    markPrompted,
    clearPrompted,
    list,
    info,
    string,
};