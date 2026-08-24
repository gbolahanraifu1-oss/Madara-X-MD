'use strict';
const fs   = require('fs');
const path = require('path');
const { getRandomBanner } = require('../../lib/menuBanner');
const { menuBox } = require('../../lib/menuBox');
const { sendInteractiveList } = require('../../lib/baileysHelper');

// ── small-caps converter ────────────────────────────────────────────────────
const _SC = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',
             k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'Q',r:'ʀ',s:'s',t:'ᴛ',
             u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'};
const sc = str => String(str).toLowerCase().split('').map(c=>_SC[c]||c).join('');

function clockString(ms) {
    const h = Math.floor(ms/3600000);
    const m = Math.floor(ms/60000)%60;
    const s = Math.floor(ms/1000)%60;
    return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':');
}

function greeting() {
    const h = new Date().getHours();
    if (h < 4)  return 'ʜᴀᴘᴘʏ ᴇᴀʀʟʏ ʜᴏᴜʀs ✨';
    if (h < 10) return 'ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ 🥱';
    if (h < 15) return 'ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ 🫠';
    if (h < 18) return 'ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ 🌇';
    return 'ɢᴏᴏᴅ ɴɪɢʜᴛ 🌙';
}

// ── sub-menu quick-lists ────────────────────────────────────────────────────
function buildSubMenu(cmd, p) {
    const menus = {
        botmenu:     menuBox('🤖','ʙᴏᴛ ᴍᴇɴᴜ',[`📡 _${p}ᴀʟɪᴠᴇ_`,`📶 _${p}ᴘɪɴɢ_`,`🕒 _${p}ᴜᴘᴛɪᴍᴇ_`,`👤 _${p}ᴏᴡɴᴇʀ_`,`🔄 _${p}ʀᴇsᴛᴀʀᴛ_`,`🧹 _${p}ᴄʟᴇᴀʀᴄᴀᴄʜᴇ_`,`🚫 _${p}ʙʟᴏᴄᴋʟɪsᴛ_`,`⚡ _${p}sᴇᴛᴘʀᴇғɪx_`]),
        dlmenu:      menuBox('📥','ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ',[`🎵 _${p}ᴘʟᴀʏ / sᴏɴɢ_`,`📹 _${p}ʏᴛᴍᴘ4 / ʏᴛᴅʟ_`,`🎧 _${p}ʏᴛᴍᴘ3_`,`🖼️ _${p}ᴘɪɴᴛᴇʀᴇsᴛ_`,`🐱‍🏍 _${p}ɢɪᴛᴄʟᴏɴᴇ_`,`🐤 _${p}ᴛᴡɪᴛᴛᴇʀ_`,`🎥 _${p}ᴛɪᴋᴛᴏᴋ / ɪɢ_`,`📘 _${p}ғᴀᴄᴇʙᴏᴏᴋ_`]),
        economymenu: menuBox('💰','ᴇᴄᴏɴᴏᴍʏ ᴍᴇɴᴜ',[`🪙 _${p}ᴅᴀɪʟʏ / ᴡᴇᴇᴋʟʏ_`,`🏆 _${p}ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ_`,`🎲 _${p}sʟᴏᴛ <ᴀᴍᴏᴜɴᴛ>_`,`⛏️ _${p}ᴍɪɴᴇ / ᴡᴏʀᴋ_`,`🏦 _${p}ʙᴀɴᴋ / ᴅᴇᴘᴏsɪᴛ_`,`💸 _${p}ᴛʀᴀɴsғᴇʀ_`,`⚔️ _${p}ʀᴏʙ_`,`📊 _${p}ʙᴀʟᴀɴᴄᴇ_`]),
        gamemenu:    menuBox('🎮','ɢᴀᴍᴇ ᴍᴇɴᴜ',[`♟️ _${p}ᴄʜᴇss_`,`🎯 _${p}ᴀᴋɪɴᴀᴛᴏʀ_`,`🃏 _${p}ʜᴀɴɢᴍᴀɴ_`,`❓ _${p}ᴛʀɪᴠɪᴀ_`,`🎰 _${p}sʟᴏᴛ_`,`🔤 _${p}ᴡᴏʀᴅɢᴀᴍᴇ_`,`🎲 _${p}ᴡᴏᴜʟᴅʏᴏᴜʀᴀᴛʜᴇʀ_`]),
        toolmenu:    menuBox('🧰','ᴜᴛɪʟɪᴛʏ ᴍᴇɴᴜ',[`🌐 _${p}ᴛʀᴀɴsʟᴀᴛᴇ_`,`🔊 _${p}ᴛᴛs_`,`🌦️ _${p}ᴡᴇᴀᴛʜᴇʀ_`,`📞 _${p}ᴛʀᴜᴇᴄᴀʟʟᴇʀ_`,`📧 _${p}ᴛᴇᴍᴘᴍᴀɪʟ_`,`📸 _${p}ss <ᴜʀʟ>_`,`📋 _${p}ᴏᴄʀ_`,`🔢 _${p}ᴄᴀʟᴄ_`,`📄 _${p}ᴛᴏᴘᴅғ_`]),
        logomenu:    menuBox('🎩','ʟᴏɢᴏ ᴍᴇɴᴜ',[`_${p}3ᴅsɪʟᴠᴇʀ / ɢᴏʟᴅ_`,`_${p}ɴᴇᴏɴ / ɢʟɪᴛᴄʜ_`,`_${p}ᴍᴀᴛʀɪx / ʜᴀᴄᴋᴇʀ_`,`_${p}ᴍᴀʀᴠᴇʟ / ᴊᴏᴋᴇʀ_`,`_${p}ɢᴀᴍɪɴɢ / ɢʀᴀᴅɪᴇɴᴛ_`,`_${p}ɢғx1 - ${p}ɢғx12_`]),
        nsfwmenu:    menuBox('🌙','ɴsғᴡ ᴍᴇɴᴜ',[`_${p}ɴᴇᴋᴏ / ᴡᴀɪғᴜ_`,`_${p}ɴᴜᴅᴇ / ᴛᴏᴘʟᴇss_`,`_${p}sᴇx / ʜᴇɴᴛᴀɪ_`,`⚠️ _18+ ᴏɴʟʏ_`]),
        eyemenu:     menuBox('👁️','ᴍᴀᴅᴀʀᴀ ᴇʏᴇ',[
            `🍎 _${p}ɪᴏs <ɴᴜᴍʙᴇʀ>_`,
            `🔘 _${p}ɴᴜʟʟ <ɴᴜᴍʙᴇʀ>_`,
            `📱 _${p}sᴀᴍsᴜɴɢ <ɴᴜᴍʙᴇʀ>_`,
            `🔗 _${p}ᴘʀᴇᴠɪᴇᴡ <ɴᴜᴍʙᴇʀ>_`,
            `🎥 _${p}ᴠɪᴅx <ɴᴜᴍʙᴇʀ>_`,
            `💣 _${p}ᴄʀᴀsʜ <ɴᴜᴍʙᴇʀ>_`,
            `👁️ _${p}ᴍᴀᴅᴀʀᴀᴇʏᴇ <ɴᴜᴍʙᴇʀ>_`,
            `💥 _${p}ɢʀᴏᴜᴘᴄʀᴀsʜ <ʟɪɴᴋ>_`,
        ]),
    };
    return menus[cmd] || null;
}

module.exports = {
    name:      'menu',
    aliases:   ['commands','cmds','help','h','main'],
    category:  'system',
    desc:      'sʜᴏᴡ ᴄᴏᴍᴍᴀɴᴅ ᴍᴇɴᴜ',
    usage:     '.menu',
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const s      = ctx.settings;
        const prefix = s.prefix || '.';
        const name   = ctx.pushName || sc(s.ownerName);

        // ── Sub-menu shortcut ────────────────────────────────────────────────
        const subcmd = args[0]?.toLowerCase().replace(prefix, '');
        if (subcmd) {
            const sub = buildSubMenu(subcmd, prefix);
            if (sub) return sock.sendMessage(ctx.from, { text: sub }, { quoted: msg });
        }

        // ── Build menu text ──────────────────────────────────────────────────
        const uptime = clockString(process.uptime() * 1000);
        const now    = new Date();
        const date   = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const time   = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const str =
`❤️ *_ʜᴇʟʟᴏ ${name}, ${greeting()}! ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴍʏ ᴍᴇɴᴜ!_* 🥳
╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│━━━❮❮ ᴄᴍᴅ ʟɪɴᴇ ❯❯━━━━━
┃✰│𝙽𝚊𝚖𝚎: ${sc(s.botName)}
┃✰│𝚃𝚘𝚝𝚊𝚕: 700+ ғᴇᴀᴛᴜʀᴇs
┃✰│ᴠᴇʀꜱɪᴏɴ: v${sc(s.version)}
┃✰│ᴏᴡɴᴇʀ: *${sc(s.ownerName)}*
┃✰│ᴘʀᴇꜰɪx: *${prefix}*
┃✰│ᴍᴏᴅᴇ: *${sc(s.commandMode || 'public')}*
┃✰│ᴜᴘᴛɪᴍᴇ: ${uptime}
┃✰│ᴅᴀᴛᴇ: ${date}
┃✰│ᴛɪᴍᴇ: ${time}

┃✰│━━━❮❮ ᴄᴀᴛᴇɢᴏʀɪᴇs ❯❯━━━━
┃✰│ \`${prefix}ʙᴏᴛᴍᴇɴᴜ\`
┃✰│ \`${prefix}ɢʀᴏᴜᴘᴍᴇɴᴜ\`
┃✰│ \`${prefix}ᴅʟᴍᴇɴᴜ\`
┃✰│ \`${prefix}ᴀɪᴍᴇɴᴜ\`
┃✰│ \`${prefix}ғᴜɴᴍᴇɴᴜ\`
┃✰│ \`${prefix}sᴛɪᴄᴋᴇʀᴍᴇɴᴜ\`
┃✰│ \`${prefix}ᴇᴄᴏɴᴏᴍʏᴍᴇɴᴜ\`
┃✰│ \`${prefix}ᴛᴏᴏʟᴍᴇɴᴜ\`
┃✰│ \`${prefix}sᴇᴀʀᴄʜᴍᴇɴᴜ\`
┃✰│ \`${prefix}ᴏᴡɴᴇʀᴍᴇɴᴜ\`
┃✰│ \`${prefix}ᴄᴏɴᴠᴇʀᴛᴇʀᴍᴇɴᴜ\`
┃✰│ \`${prefix}ʟᴀɴɢᴜᴀɢᴇᴍᴇɴᴜ\`
┃✰│ \`${prefix}ᴍɪsᴄᴍᴇɴᴜ\`
┃✰│ \`${prefix}ᴍᴀᴅᴀʀᴀᴇʏᴇᴍᴇɴᴜ\`
┃✰│ \`${prefix}sʜᴏᴘ\`
┃✰│ \`${prefix}ᴀʟʟᴍᴇɴᴜ\`
┃✰│──────────●●►
┃✰│   ▎▍▌▌▉▏▎▌▉▐▏▌▎
┃✰│   ©𝐌𝐀𝐃𝐀𝐑𝐀 𝐗-𝐌𝐃 𝐁𝐎𝐓
┃✰│   ✧ ${require('../../lib/madaraQuotes').getQuote('menu', ctx.sender)}
╰──────────────────
ᴛʜᴀɴᴋ ʏᴏᴜ ғᴏʀ ᴄʜᴏᴏsɪɴɢ ᴍᴀᴅᴀʀᴀ x-ᴍᴅ
ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${sc(s.ownerName)}❤️
─═✧✧═─ 𝕄𝔸𝔻𝔸ℝ𝔸 𝕏-𝕄𝔻 ─═✧✧═─`;

        // ── Channel/newsletter context — FIXED: no forwarding score ────────
        const channelCtx = s.newsletterJid ? {
            isForwarded: true,
            forwardingScore: 1,
            forwardedNewsletterMessageInfo: {
                newsletterJid:  s.newsletterJid,
                newsletterName: s.channelName || s.botName,
                serverMessageId: 143,
            }
        } : {};

        // ── Pick random banner ──────────────────────────────────────────────
        let bannerSrc;
        try {
            const localBanner = getRandomBanner(ctx.sender);
            bannerSrc = localBanner && fs.existsSync(localBanner)
                ? { image: fs.readFileSync(localBanner) }
                : { image: { url: '' } };
        } catch { bannerSrc = { image: { url: '' } }; }

        // ── 1. Send the menu card ────────────────────────────────────────────
        try {
            await sock.sendMessage(ctx.from, {
                ...bannerSrc,
                caption: str + `\n\n*Q̲ᴜɪᴄᴋ:* ${prefix}ʙᴏᴛᴍᴇɴᴜ | ${prefix}ɢʀᴏᴜᴘᴍᴇɴᴜ | ${prefix}ᴅʟᴍᴇɴᴜ | ${prefix}ᴇʏᴇᴍᴇɴᴜ`,
                contextInfo: channelCtx,
            }, { quoted: msg });
        } catch (e) {
            console.log('[Menu] Card send failed, using text fallback:', e.message);
            await sock.sendMessage(ctx.from, { text: str }, { quoted: msg });
        }

        // Keep the original menu card format; do not send a separate
        // interactive Menu button.

        // ── 2. Send menu audio ───────────────────────────────────────────────
        try {
            const audioBuf = await require('../../lib/toAudio').toPTT(
                require('fs').readFileSync(require('path').join(process.cwd(), 'media', 'Menu.mp3')),
                'mp3'
            );
            await sock.sendMessage(ctx.from, {
                audio: audioBuf,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true,
            }, { quoted: msg });
        } catch (_) { /* skip if audio unavailable */ }
    }
};