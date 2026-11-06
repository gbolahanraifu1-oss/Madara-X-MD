'use strict';

/**
 * Explicit reply card. Commands that import and call menuBox() always get
 * this frame — independent of auto-frame on/off.
 */

function clean(value) {
    return String(value ?? '').replace(/\*/g, '');
}

function linesOf(lines) {
    if (Array.isArray(lines)) return lines.map(l => String(l ?? ''));
    if (lines == null) return [];
    return String(lines).split(/\r?\n/);
}

function menuBox(emoji, title, lines) {
    const body = linesOf(lines).map(l => `┃✰│${clean(l)}`).join('\n');
    return `╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│━━━❮❮ ${clean(emoji)} ${clean(title)} ❯❯━━━━━
${body}
┃✰│──────────●●►
┃✰│   ▎▍▌▌▉▏▎▌▉▐▏▌▎
┃✰│   ©𝐌𝐀𝐃𝐀𝐑𝐀 𝐗-𝐌𝐃
╰──────────────────`;
}

module.exports = { menuBox };
