'use strict';

const database = require('../utils/database');
const fontSystem = require('../utils/fontSystem');
const { boxify } = require('../utils/styleBox');

// Leave code, URLs, and email/JID-like tokens usable after font conversion.
const PRESERVED = /(\x60{3}[\s\S]*?\x60{3}|\x60[^\x60\n]*?\x60|https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+)/g;

function formatTextForFont(text, fontNumber = 15) {
    if (typeof text !== 'string' || !text) return text;
    const requested = Number(fontNumber);
    const selected = fontSystem.isValidFont(requested) ? requested : 15;
    return text.split(PRESERVED).map((part, index) =>
        index % 2 === 1 ? part : fontSystem.convert(part, selected)
    ).join('');
}

function formatText(phone, text) {
    if (typeof text !== 'string' || !text.trim()) return text;
    const fontNumber = phone ? database.getFont(phone) : 15;
    return boxify(formatTextForFont(text, fontNumber));
}

function formatOutgoingContent(phone, content) {
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

module.exports = { formatTextForFont, formatText, formatOutgoingContent, wrapOutgoingSocket };
