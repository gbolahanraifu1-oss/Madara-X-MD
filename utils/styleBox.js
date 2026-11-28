/**
 * styleBox — Madara X-MD shared text styling helpers.
 * Akatsuki / Crimson Command layout + Unicode typography helpers.
 */

// Mathematical Sans-Serif Bold Italic block (𝘼𝘽𝘾 / 𝙖𝙗𝙘)
function boldItalic(str) {
    const upperBase = 0x1D63C;
    const lowerBase = 0x1D656;
    let out = '';
    for (const ch of String(str)) {
        const c = ch.codePointAt(0);
        if (c >= 0x41 && c <= 0x5A)      out += String.fromCodePoint(upperBase + (c - 0x41));
        else if (c >= 0x61 && c <= 0x7A) out += String.fromCodePoint(lowerBase + (c - 0x61));
        else out += ch;
    }
    return out;
}

// Mathematical Sans-Serif Bold block (𝐀𝐁𝐂 / 𝐚𝐛𝐜 / 𝟎𝟏𝟐)
function boldSans(str) {
    const upperBase = 0x1D5D4;
    const lowerBase = 0x1D5EE;
    const digitBase = 0x1D7EC;
    let out = '';
    for (const ch of String(str)) {
        const c = ch.codePointAt(0);
        if (c >= 0x41 && c <= 0x5A)      out += String.fromCodePoint(upperBase + (c - 0x41));
        else if (c >= 0x61 && c <= 0x7A) out += String.fromCodePoint(lowerBase + (c - 0x61));
        else if (c >= 0x30 && c <= 0x39) out += String.fromCodePoint(digitBase + (c - 0x30));
        else out += ch;
    }
    return out;
}

// Format a structured key-value line inside a card
function field(label, value) {
    return `▸ ${boldSans(label)}: ${value}`;
}

// Insert a clean horizontal divider inside multi-section replies
function divider() {
    return `┄┄┄┄┄┄┄┄┄┄┄┄┄┄`;
}

// Normalize a sender JID or tag into a clean "@number" mention string
function formatUserTag(userOrJid) {
    if (!userOrJid) return '';
    const raw = String(userOrJid).trim();
    const withoutDomain = raw.includes('@') ? raw.split('@')[0] : raw;
    const cleanNumber = withoutDomain.replace(/^@/, '').split(':')[0];
    return cleanNumber ? `@${cleanNumber}` : '';
}

// Wrap a single paragraph into lines up to maxLen characters (Unicode-safe)
function wrapParagraph(paragraph, maxLen) {
    const chars = [...paragraph];
    if (chars.length <= maxLen) return [paragraph];

    const words = paragraph.split(/\s+/).filter(Boolean);
    const wrapped = [];
    let current = '';

    for (const word of words) {
        const wordChars = [...word];
        if (wordChars.length > maxLen) {
            if (current) {
                wrapped.push(current);
                current = '';
            }
            for (let i = 0; i < wordChars.length; i += maxLen) {
                wrapped.push(wordChars.slice(i, i + maxLen).join(''));
            }
            continue;
        }

        const candidate = current ? `${current} ${word}` : word;
        if ([...candidate].length <= maxLen) {
            current = candidate;
        } else {
            wrapped.push(current);
            current = word;
        }
    }

    if (current) wrapped.push(current);
    return wrapped;
}

// Wrap plain text into the Madara X-MD card with every line prefixed by ║
function boxify(text, title = 'MADARA X-MD', options = {}) {
    const raw = String(text == null ? '' : text);
    const trimmed = raw.trim();
    if (!trimmed) return raw;

    // Avoid double-wrapping already boxed strings
    if (/^[╭╔┌]/.test(trimmed)) {
        return raw;
    }

    const {
        user,
        status,
        footer = boldItalic('Madara X-MD'),
        compact = false,
        maxWidth = 34,
    } = options;

    const tag = formatUserTag(user);
    const statusLine = status != null
        ? status
        : (tag ? `ᴍᴀᴅᴀʀᴀ • ${tag}` : 'ᴍᴀᴅᴀʀᴀ');

    const expandedLines = [];
    for (const rawLine of raw.split('\n')) {
        if (rawLine.trim() === '') {
            expandedLines.push('');
        } else {
            const wrappedChunks = wrapParagraph(rawLine.trim(), maxWidth);
            for (const chunk of wrappedChunks) {
                expandedLines.push(`  ${chunk}`);
            }
        }
    }

    const body = compact ? expandedLines.filter((line) => line !== '') : expandedLines;

    return [
        `╔═❖ ${boldItalic(title)} ❖═╗`,
        statusLine ? `║  ● ${statusLine}` : null,
        `╠══════════════`,
        ...body.map((line) => (line === '' ? '║' : `║${line}`)),
        `╚══════════════`,
        footer ? `   ▲ ${footer}` : null,
    ]
        .filter((part) => part !== null)
        .join('\n');
}

module.exports = { boldItalic, boldSans, field, divider, formatUserTag, boxify };
