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

// Wrap plain text into the Akatsuki / Crimson Command card.
// Pass options like { status: 'ERROR', footer: 'Custom Tag' } per command.
function boxify(text, title = 'MADARA X-MD', options = {}) {
    const raw = String(text == null ? '' : text);
    const trimmed = raw.trim();
    if (!trimmed) return raw;

    // Avoid double-wrapping already boxed strings
    if (/^[╭╔┌]/.test(trimmed)) {
        return raw;
    }

    const {
        status = 'ＡＫＡＴＳＵＫＩ • ＯＮＬＩＮＥ',
        footer = boldItalic('Madara X-MD'),
        compact = false,
    } = options;

    const lines = raw.split('\n').map((line) => (line.trim() === '' ? '' : `  ${line}`));
    const body = compact ? lines.filter((line) => line !== '') : lines;

    return [
        `╔═❖ ${boldItalic(title)} ❖═╗`,
        status ? `║  ● ${boldSans(status)}` : null,
        `╠══════════════`,
        ...body.map((line) => (line === '' ? '║' : `║${line}`)),
        `╚══════════════`,
        footer ? `   ▲ ${footer}` : null,
    ]
        .filter((part) => part !== null)
        .join('\n');
}

module.exports = { boldItalic, boldSans, field, divider, boxify };
