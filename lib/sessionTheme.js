'use strict';

const fs = require('fs');
const path = require('path');
const db = require('./db');
const { toSmallCaps } = require('./smallcaps');

const DIR = path.join(process.cwd(), 'themes');
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

// Session settings already live below sessions/<phone>/data.  Flush the
// dirty session immediately after a selection as well as through db's
// normal debounce, so a quick restart cannot lose the chosen theme.
async function set(phone, name) {
    const n = normalise(name);
    const theme = load(n);
    if (!theme) return null;
    db.setSession(phone, 'config', 'theme', n);
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

async function themePrompt(c) {
    // Keep the first-run prompt as plain text.  Some WhatsApp clients accept
    // a native-flow relay without displaying it, which used to leave a new
    // pairing unable to choose a theme or run commands.
    return c.reply(toSmallCaps(promptText()));
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
    if (!c?.isSessionOwnerChat || c.isCmd) return false;
    const name = selectionName(selectionFromMessage(msg) || c.body);
    if (!name) return false;
    return applySelection(c, name);
}

async function enforce(sock, msg, c) {
    if (!c?.isSessionOwnerChat) return false;
    const theme = get(c.sessionPhone);
    if (!theme) {
        if (c.isCmd && ['theme', 'themes', 'settheme'].includes(c.rawCmd)) return false;
        await themePrompt(c);
        return true;
    }
    return false;
}

function list() { return NAMES.slice(); }

module.exports = {
    NAMES, load, get, set, footer, format, themePrompt,
    handlePendingText, enforce, list, info, string,
};