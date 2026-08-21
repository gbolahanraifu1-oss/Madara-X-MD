// ╔══════════════════════════════════════════════════════╗
// ║   MADARA X-MD — Small Caps Text Transformer        ║
// ║   Converts outgoing message text to sᴍᴀʟʟ ᴄᴀᴘs      ║
// ║   while leaving code blocks / URLs / mentions intact ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const MAP = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ',
    i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ',
    q: 'Q', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x',
    y: 'ʏ', z: 'ᴢ',
};

// Anything ASCII a-z/A-Z that should NEVER be touched — code blocks, inline
// code, URLs and email-like tokens. Split the string on these, convert only
// the parts in between.
const SKIP_RE = /(```[\s\S]*?```|`[^`\n]*?`|https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+)/g;

function convertRun(str) {
    return str.replace(/[a-zA-Z]/g, ch => MAP[ch.toLowerCase()] || ch);
}

function toSmallCaps(str) {
    if (typeof str !== 'string' || !str) return str;
    return str.split(SKIP_RE).map((chunk, i) => {
        // Odd indices are the captured "skip" groups from split() — leave as-is.
        if (i % 2 === 1) return chunk;
        return convertRun(chunk);
    }).join('');
}

module.exports = { toSmallCaps };
