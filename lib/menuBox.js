'use strict';
// Exact same visual style as the main .menu card, reused by category menus.
// Category output is intentionally plain text: WhatsApp clients and themes can
// render Markdown differently, so never leak bold markers from command rows.
function clean(value) {
  return String(value ?? '').replace(/\*/g, '');
}

function menuBox(emoji, title, lines) {
  const body = lines.map(l => `┃✰│${clean(l)}`).join('\n');
  return `╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│━━━❮❮ ${clean(emoji)} ${clean(title)} ❯❯━━━━━
${body}
┃✰│──────────●●►
┃✰│   ▎▍▌▌▉▏▎▌▉▐▏▌▎
┃✰│   ©𝐌𝐀𝐃𝐀𝐑𝐀 𝐗-𝐌𝐃 𝐁𝐎𝐓
╰──────────────────`;
}

module.exports = { menuBox };
