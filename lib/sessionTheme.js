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
const { formatText } = require('./outgoingStyle');

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
    return formatText(phone, text);
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
                `\( {i + 1}. * \){name.toUpperCase()}* — ${DESCRIPTIONS[name]}`
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
 * window, not the persistent pair flag. Auto-expires after 10 min.
 * When the window expires without a selection we also clear the
 * persistent "prompted" flag so enforce() can re-send the prompt
 * instead of permanently locking the owner's DM.
 * ────────────────────────────────────────────────────────────────── */
const pendingByPhone = new Map();
const PENDING_WINDOW_MS = 10 * 60 * 1000;

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
        // Selection window died — allow a fresh prompt on next DM.
        clearPrompted(key);
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

/* ── Send the prompt. Only mark "prompted" AFTER a successful send. ──
 * Previously we marked prompted/pending before the send; if the
 * message failed (or never reached WA) the owner was stuck: enforce()
 * blocked every DM while themePrompt() refused to re-send.
 * ────────────────────────────────────────────────────────────────── */
async function themePrompt(c, { force = false } = {}) {
    const key = pendingKey(c);
    if (!key) return null;

    if (!force) {
        if (hasBeenPrompted(key)) return null;
        if (isPending(key)) return null;
    }

    // Open the selection window first so a concurrent message can still
    // be accepted while the prompt is in flight.
    markPending(key);

    let sent = null;
    try {
        sent = await c.reply(toSmallCaps(promptText()));
    } catch (e) {
        // Send failed — roll back so the next DM can try again.
        clearPending(key);
        clearPrompted(key);
        console.error('[sessionTheme] themePrompt send failed:', e.message);
        return null;
    }

    if (!sent) {
        clearPending(key);
        clearPrompted(key);
        return null;
    }

    markPrompted(key);

    const id = sent?.key?.id;
    if (id) {
        pendingPromptIds.add(id);
        setTimeout(() => pendingPromptIds.delete(id), PENDING_WINDOW_MS).unref?.();
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
 * Accept a selection while the live pending window is open.
 * Also accept a clear 1–5 / theme name when the owner has NO theme
 * yet (covers the case where the window expired mid-session but the
 * user is still trying to pick).
 * ────────────────────────────────────────────────────────────────── */
async function handlePendingText(sock, msg, c) {
    if (!c?.isSessionOwnerChat) return false;

    const phone = c.sessionPhone || c.sender || '';
    const selected = selectionName(
        selectionFromMessage(msg) || c.body
    );
    if (!selected) return false;

    // Live window open → always accept.
    if (isPending(phone)) {
        return applySelection(c, selected);
    }

    // No theme set yet → still accept a clear selection so the owner
    // is never permanently locked out of DM after a timeout.
    if (!get(phone)) {
        return applySelection(c, selected);
    }

    return false;
}

async function enforce(sock, msg, c) {
    if (!c?.isSessionOwnerChat) return false;

    const theme = get(c.sessionPhone);

    if (!theme) {
        // If the previous prompt timed out, isPending() already cleared
        // the prompted flag. force=true only when we know we must re-send
        // because there is still no theme and no live window.
        const key = pendingKey(c);
        const needsForce = !isPending(key) && hasBeenPrompted(key);
        if (needsForce) clearPrompted(key);
        await themePrompt(c, { force: needsForce });
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