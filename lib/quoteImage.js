'use strict';

function escapeXml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function wrapQuoteText(value, maxChars = 36, maxLines = 10) {
    const words = String(value || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    const lines = [];
    let current = '';
    for (const word of words) {
        const chunks = word.match(new RegExp('.{1,' + maxChars + '}', 'gu')) || [word];
        for (const part of chunks) {
            if (!current) current = part;
            else if (Array.from(current + ' ' + part).length <= maxChars) current += ' ' + part;
            else { lines.push(current); current = part; }
            if (lines.length >= maxLines) return lines;
        }
    }
    if (current && lines.length < maxLines) lines.push(current);
    return lines;
}

async function makeQuoteImage(text, name) {
    const sharp = require('sharp');
    const lines = wrapQuoteText(text, 36, 9);
    if (!lines.length) throw new Error('Quote text is empty.');
    const quoteRows = lines.map((line, index) => '<text x="540" y="' + (370 + index * 62) + '" text-anchor="middle" class="quote">' + escapeXml(line) + '</text>').join('');
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='1080' height='1080' viewBox='0 0 1080 1080'><defs><linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#111827'/><stop offset='1' stop-color='#080b12'/></linearGradient></defs><rect width='1080' height='1080' rx='58' fill='url(#bg)'/><rect x='45' y='45' width='990' height='990' rx='42' fill='none' stroke='#e11d48' stroke-width='4'/><text x='90' y='230' fill='#e11d48' font-size='150' font-family='Georgia,serif'>“</text>" + quoteRows + "<text x='540' y='890' text-anchor='middle' fill='#fda4af' font-size='34' font-family='Arial,sans-serif'>— " + escapeXml(name || 'Madara X-MD') + "</text><text x='540' y='990' text-anchor='middle' fill='#9ca3af' font-size='24' letter-spacing='7' font-family='Arial,sans-serif'>MADARA X-MD</text></svg>";
    return sharp(Buffer.from(svg)).png().toBuffer();
}

module.exports = { escapeXml, wrapQuoteText, makeQuoteImage };
