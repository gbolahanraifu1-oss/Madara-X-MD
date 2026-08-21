'use strict';
// Exact same visual style as the main .menu card (see commands/system/menu.js),
// reused for every subcategory menu (.groupmenu, .funmenu, .files, .shop, etc.)
// so nothing looks like a different, cheaper screen:
//
// ╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
// ┃✰│━━━❮❮ 👥 ᴛɪᴛʟᴇ ❯❯━━━━━
// ┃✰│line 1
// ┃✰│line 2
// ┃✰│──────────●●►
// ┃✰│   ▎▍▌▌▉▏▎▌▉▐▏▌▎
// ┃✰│   ©𝐌𝐀𝐃𝐀𝐑𝐀 𝐗-𝐌𝐃 𝐁𝐎𝐓
// ╰──────────────────
function menuBox(emoji, title, lines) {
  const body = lines.map(l => `┃✰│${l}`).join('\n');
  return `╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│━━━❮❮ ${emoji} ${title} ❯❯━━━━━
${body}
┃✰│──────────●●►
┃✰│   ▎▍▌▌▉▏▎▌▉▐▏▌▎
┃✰│   ©𝐌𝐀𝐃𝐀𝐑𝐀 𝐗-𝐌𝐃 𝐁𝐎𝐓
╰──────────────────`;
}

module.exports = { menuBox };
