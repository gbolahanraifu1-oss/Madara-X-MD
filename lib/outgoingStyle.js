'use strict';

/**
 * Outgoing message formatting.
 * Font always applies. Auto-frame wraps plain replies when enabled.
 */

const database = require('../utils/database');
const fontSystem = require('../utils/fontSystem');
const { boxify } = require('../utils/styleBox');
const { menuBox } = require('./menuBox');
const requestContext = require('./requestContext');

const PRESERVED = /(\x60{3}[\s\S]*?\x60{3}|\x60[^\x60\n]*?\x60|https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+)/g;

function phoneKey(phone) {
    if (phone == null || phone === '') return '';
    return String(phone).replace(/[^0-9]/g, '') || String(phone).trim();
}

function safeGetFont(phone) {
    try {
        if (phone && typeof database.getFont === 'function') {
            const n = Number(database.getFont(phone));
            return Number.isFinite(n) ? n : 15;
        }
    } catch (_) {}
    return 15;
}

function safeGetBoxStyle(phone) {
    try {
        if (phone && typeof database.getBoxStyle === 'function') {
            const s = database.getBoxStyle(phone);
            if (s === 'styleBox' || s === 'menuBox') return s;
        }
    } catch (_) {}
    return 'menuBox';
}

function safeGetAutoFrame(phone) {
    try {
        if (!phone) return false;
        if (typeof database.getAutoFrame === 'function') {
            return database.getAutoFrame(phone) === true;
        }
        // Fallback: read raw users map if method missing
        const users = database.data && database.data.users;
        if (!users) return false;
        const key = phoneKey(phone);
        if (key && users[key]?.autoFrame === true) return true;
        const legacy = String(phone).trim();
        if (legacy && users[legacy]?.autoFrame === true) return true;
    } catch (_) {}
    return false;
}

function formatTextForFont(text, fontNumber = 15) {
    if (typeof text !== 'string' || !text) return text;
    const selected = fontSystem.isValidFont(Number(fontNumber)) ? Number(fontNumber) : 15;
    return text.split(PRESERVED).map((part, index) =>
        index % 2 === 1 ? part : fontSystem.convert(part, selected)
    ).join('');
}

function applyBoxStyle(text, boxStyle, autoFrame) {
    const raw = String(text == null ? '' : text);
    const trimmed = raw.trim();
    if (!trimmed) return raw;

    // Already a framed card — never double-wrap
    if (trimmed.startsWith('╭') || trimmed.startsWith('╔') || trimmed.startsWith('┌')) {
        return raw;
    }

    if (!autoFrame) return raw;

    if (boxStyle === 'styleBox') {
        try {
            return boxify(raw);
        } catch (e) {
            console.error('[outgoingStyle] boxify failed:', e.message);
            return raw;
        }
    }

    // menuBox (default when auto-frame on)
    try {
        return menuBox('💬', 'MADARA X-MD', raw.split(/\r?\n/));
    } catch (e) {
        console.error('[outgoingStyle] menuBox failed:', e.message);
        return raw;
    }
}

function formatText(phone, text) {
    if (typeof text !== 'string' || !text.trim()) return text;
    if (phone) {
        try { requestContext.setPhone(phone); } catch (_) {}
    }
    const fontNumber = safeGetFont(phone);
    const boxStyle = safeGetBoxStyle(phone);
    const autoFrame = safeGetAutoFrame(phone);
    return applyBoxStyle(formatTextForFont(text, fontNumber), boxStyle, autoFrame);
}

function formatOutgoingContent(phone, content) {
    if (phone) {
        try { requestContext.setPhone(phone); } catch (_) {}
    }

    if (typeof content === 'string') {
        return { text: formatText(phone, content) };
    }
    if (!content || typeof content !== 'object') return content;

    let formatted = content;
    for (const field of ['text', 'caption']) {
        if (typeof content[field] !== 'string') continue;
        if (formatted === content) formatted = { ...content };
        formatted[field] = formatText(phone, content[field]);
    }
    return formatted;
}

function wrapOutgoingSocket(sock, phone) {
    return new Proxy(sock, {
        get(target, property, receiver) {
            if (property === 'sendMessage') {
                return (jid, content, ...rest) =>
                    target.sendMessage(jid, formatOutgoingContent(phone, content), ...rest);
            }
            return Reflect.get(target, property, receiver);
        },
    });
}

module.exports = {
    formatTextForFont,
    applyBoxStyle,
    formatText,
    formatOutgoingContent,
    wrapOutgoingSocket,
};
