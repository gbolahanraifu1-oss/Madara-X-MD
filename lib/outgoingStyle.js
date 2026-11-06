'use strict';

/**
 * Outgoing message formatting.
 *
 * Font conversion always runs.
 *
 * Auto-frame (per session, default OFF — same as main branch):
 *   OFF → plain ctx.reply stays plain; only explicit menuBox() draws a card
 *   ON  → plain replies are wrapped in the session box style (menuBox|styleBox)
 *
 * Toggle:  .autoframe on | off
 * Style:   .boxstyle menubox | stylebox
 *
 * All database lookups are guarded — missing methods never crash the bot.
 */

const database = require('../utils/database');
const fontSystem = require('../utils/fontSystem');
const { boxify } = require('../utils/styleBox');
const { menuBox } = require('./menuBox');
const requestContext = require('./requestContext');

const PRESERVED = /(\x60{3}[\s\S]*?\x60{3}|\x60[^\x60\n]*?\x60|https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+)/g;

function safeGetFont(phone) {
    try {
        if (phone && typeof database.getFont === 'function') {
            return database.getFont(phone);
        }
    } catch (_) {}
    return 15;
}

function safeGetBoxStyle(phone) {
    try {
        if (phone && typeof database.getBoxStyle === 'function') {
            return database.getBoxStyle(phone);
        }
    } catch (_) {}
    return 'menuBox';
}

function safeGetAutoFrame(phone) {
    try {
        if (phone && typeof database.getAutoFrame === 'function') {
            return database.getAutoFrame(phone) === true;
        }
    } catch (_) {}
    // Missing method → treat as OFF (main-branch behaviour)
    return false;
}

function formatTextForFont(text, fontNumber = 15) {
    if (typeof text !== 'string' || !text) return text;
    const requested = Number(fontNumber);
    const selected = fontSystem.isValidFont(requested) ? requested : 15;
    return text.split(PRESERVED).map((part, index) =>
        index % 2 === 1 ? part : fontSystem.convert(part, selected)
    ).join('');
}

function applyBoxStyle(text, boxStyle, autoFrame) {
    const raw = String(text == null ? '' : text);
    const trimmed = raw.trim();
    if (!trimmed) return raw;

    // Already framed — never double-wrap
    if (trimmed.startsWith('╭') || trimmed.startsWith('╔') || trimmed.startsWith('┌')) {
        return raw;
    }

    // Auto-frame OFF (default) → plain text
    if (!autoFrame) return raw;

    if (boxStyle === 'styleBox') return boxify(raw);
    return menuBox('💬', 'MADARA X-MD', raw.split(/\r?\n/));
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
    if (typeof content === 'string') return { text: formatText(phone, content) };
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
