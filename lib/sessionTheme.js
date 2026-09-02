'use strict';

const fs = require('fs');
const path = require('path');
const db = require('./db');
const { toSmallCaps } = require('./smallcaps');

const DIR = path.join(process.cwd(), 'themes');
const PENDING_KEY = 'themePending';
const NAMES = ['madara', 'naruto', 'akatsuki', 'sharingan', 'itachi'];
const DESCRIPTIONS = {
    madara: 'ᴡᴀᴋᴇ ᴜᴘ ᴛᴏ ʀᴇᴀʟɪᴛʏ',
    naruto: 'ᴡɪʟʟ ᴏғ ғɪʀᴇ',
    akatsuki: 'sʜᴀᴅᴏᴡs ɪɴ sɪʟᴇɴᴄᴇ',
    sharingan: 'ᴛʜᴇ ᴇʏᴇ ᴡᴀᴛᴄʜᴇs',
    itachi: 'ᴛʜᴇ ᴛʀᴜᴛʜ ɪɴ sʜᴀᴅᴏᴡs',
};

function normalise(name) {
    return String(name || '').toLowerCase().replace(/[^a-z]/g, '');
}

function load(name) {
    const n = normalise(name);
    if (!NAMES.includes(n)) return null;
    try { return JSON.parse(fs.readFileSync(path.join(DIR, `${n}.json`), 'utf8')); }
    catch { return null; }
}

function get(phone) {
    const n = db.getSession(phone, 'config', 'theme', '');
    return load(n);
}

function isPending(phone) {
    return Boolean(db.getSession(phone, 'config', PENDING_KEY, false));
}

async function beginPending(phone) {
    if (!phone || isPending(phone)) return false;
    db.setSession(phone, 'config', PENDING_KEY, true);
    await db.flushDirty();
    return true;
}

async function clearPending(phone) {
    if (!phone) return;
    db.setSession(phone, 'config', PENDING_KEY, false);
    await db.flushDirty();
}

function messageText(msg) {
    return msg?.message?.conversation
        || msg?.message?.extendedTextMessage?.text
        || msg?.message?.imageMessage?.caption
        || msg?.message?.videoMessage?.caption
        || '';
}

function rememberPromptMessage(sock, sent) {
    const id = sent?.key?.id;
    if (!sock || !id) return;
    if (!sock._themePromptMessageIds) sock._themePromptMessageIds = new Set();
    sock._themePromptMessageIds.add(id);
    while (sock._themePromptMessageIds.size > 100) {
        sock._themePromptMessageIds.delete(sock._themePromptMessageIds.values().next().value);
    }
}

function isThemePromptMessage(sock, msg) {
    const id = msg?.key?.id;
    if (id && sock?._themePromptMessageIds?.has(id)) return true;
    if (!msg?.key?.fromMe) return false;
    const body = messageText(msg);
    const prompt = toSmallCaps(promptText());
    return body === prompt || body === promptText();
}

// Session settings already live below sessions/<phone>/data.  Flush the
// dirty session immediately after a selection as well as through db's
// normal debounce, so a quick restart cannot lose the chosen theme.
async function set(phone, name) {
    const n = normalise(name);
    const theme = load(n);
    if (!theme) return null;
    db.setSession(phone, 'config', 'theme', n);
    db.setSession(phone, 'config', PENDING_KEY, false);
    await db.flushDirty();
    return theme;
}

function info(phone) { return get(phone)?.STRINGS?.global || null; }
function string(phone, key, fallback = '') { return info(phone)?.[key] || fallback; }
function footer(phone) { return string(phone, 'footer') ? `\n> *${string(phone, 'footer')}*` : ''; }
function format(phone, text) { return typeof text === 'string' ? toSmallCaps(text) : text; }

function selectionFromMessage(msg) {
    const interactive = msg?.message?.interactiveResponseMessage;
    const buttons = msg?.message?.buttonsResponseMessage
        || msg?.message?.templateButtonReplyMessage;
    let params = {};
    try {
        const raw = interactive?.nativeFlowResponseMessage?.paramsJson;
        if (raw) params = JSON.parse(raw);
    } catch {}
    return params.id
        || buttons?.selectedButtonId
        || buttons?.selectedId
        || buttons?.selectedDisplayText
        || msg?.message?.listResponseMessage?.singleSelectReply?.selectedRowId
        || '';
}

function selectionName(value) {
    const raw = String(value || '').trim().toLowerCase();
    const idName = raw.startsWith('madara_theme_') ? raw.slice('madara_theme_'.length) : raw;
    const map = { '1': 'madara', '2': 'naruto', '3': 'akatsuki', '4': 'sharingan', '5': 'itachi' };
    const name = map[idName] || normalise(idName);
    return NAMES.includes(name) ? name : null;
}

function promptText() {
    return '🎨 *ᴄʜᴏᴏsᴇ ʏᴏᴜʀ ᴍᴀᴅᴀʀᴀ ᴛʜᴇᴍᴇ*\n\n' +
        NAMES.map((name, i) => `${i + 1}. *${name}* — ${DESCRIPTIONS[name]}`).join('\n') +
        '\n\nʀᴇᴘʟʏ ᴡɪᴛʜ ᴀ ɴᴜᴍʙᴇʀ ᴏʀ ᴛʜᴇᴍᴇ ɴᴀᴍᴇ.';
}

async function themePrompt(c, options = {}) {
    const markedPending = options.markPending !== false && await beginPending(c.sessionPhone);
    try {
        // Keep the first-run prompt as plain text. Some WhatsApp clients accept
        // a native-flow relay without displaying it.
        const sent = await c.reply(toSmallCaps(promptText()));
        rememberPromptMessage(c.sock, sent);
        return sent;
    } catch (error) {
        if (markedPending) await clearPending(c.sessionPhone);
        throw error;
    }
}

async function applySelection(c, name) {
    const theme = await set(c.sessionPhone, name);
    if (!theme) return false;
    await c.reply(toSmallCaps(
        `✅ *ᴛʜᴇᴍᴇ sᴇᴛ:* ${theme.STRINGS.global.botName}\n\n` +
        'ᴛʜᴇ ᴛʜᴇᴍᴇ ɪs ɴᴏᴡ ᴀᴄᴛɪᴠᴇ ғᴏʀ ᴛʜɪs sᴇssɪᴏɴ.'
    ));
    return true;
}

async function handlePendingText(sock, msg, c) {
    if (!c?.isSessionOwnerChat || c.isCmd || !isPending(c.sessionPhone)) return false;
    if (isThemePromptMessage(sock, msg)) return true;
    const name = selectionName(selectionFromMessage(msg) || c.body);
    if (!name) return false;
    return applySelection(c, name);
}

async function enforce(sock, msg, c) {
    if (!c?.isSessionOwnerChat) return false;
    const theme = get(c.sessionPhone);
    if (!theme) {
        const themeCommand = c.isCmd && ['theme', 'themes', 'settheme'].includes(c.rawCmd);
        const requested = selectionName(c.args?.[0]) || selectionName(c.args?.[1]);
        // Let an explicit theme choice such as .theme naruto reach the command.
        if (themeCommand && requested) return false;
        if (!isPending(c.sessionPhone)) await themePrompt(c);
        return true;
    }
    return false;
}

function list() { return NAMES.slice(); }

module.exports = {
    NAMES, load, get, set, footer, format, themePrompt,
    handlePendingText, enforce, list, info, string, isPending, isThemePromptMessage,
};