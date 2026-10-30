'use strict';

const fs = require('fs');
const path = require('path');
const { getRandomBanner } = require('../../lib/menuBanner');
const { menuBox } = require('../../lib/menuBox');
const {
    CATEGORY_META: CAT,
    getMenuCategoryCatalog,
    getCategoryCounts,
    getCategoryMeta,
    resolveCategory,
    splitMenuLines,
} = require('../../lib/menuCategories');
const {
    generateWAMessageFromContent,
    proto,
    prepareWAMessageMedia,
} = require('@itsliaaa/baileys');

const _SC = {
    a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',
    n:'ɴ',o:'ᴏ',p:'ᴘ',q:'Q',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'
};
const sc = str => String(str).toLowerCase().split('').map(c => _SC[c] || c).join('');
const clockString = ms =>
    [Math.floor(ms / 3600000), Math.floor(ms / 60000) % 60, Math.floor(ms / 1000) % 60]
        .map(v => String(v).padStart(2, '0')).join(':');

const MENU_IMG   = path.join(process.cwd(), 'assets', 'menuimage.jpg');
const MENU_VID   = path.join(process.cwd(), 'assets', 'menuvideo.mp4');
const MENU_AUDIO = path.join(process.cwd(), 'assets', 'menu_audio.mp3');

function greeting() {
    const h = new Date().getHours();
    if (h < 4)  return 'ʜᴀᴘᴘʏ ᴇᴀʀʟʏ ʜᴏᴜʀs ✨';
    if (h < 10) return 'ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ 🥱';
    if (h < 15) return 'ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ 🫠';
    if (h < 18) return 'ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ 🌇';
    return 'ɢᴏᴏᴅ ɴɪɢʜᴛ 🌙';
}

async function sendCategoryMenu(sock, msg, ctx, catKey) {
    if (String(catKey).trim().toLowerCase() === 'more') {
        return sendCategoryDirectory(sock, msg, ctx);
    }
    const s = ctx.settings;
    catKey = resolveCategory(catKey);
    const m = getCategoryMeta(catKey);
    if (!m) return ctx.reply(`❌ Unknown category: \( {catKey} \){s.FOOTER}`);

    const { getCategories } = require('../../lib/loader');
    const cmds = (getCategories().get(catKey) || [])
        .filter((c, i, arr) => arr.findIndex(x => x.name === c.name) === i)
        .sort((a, b) => a.name.localeCompare(b.name));

    if (!cmds.length) return ctx.reply(`📭 No commands found in *\( {m.l}*. \){s.FOOTER}`);

    const pages = splitMenuLines(cmds.map(c => `\( {s.prefix || '.'} \){c.name}`));
    for (let index = 0; index < pages.length; index++) {
        const isLast = index === pages.length - 1;
        const title = `\( {m.l.toUpperCase()} ᴄᴏᴍᴀɴᴅs \){pages.length > 1 ? ` · \( {index + 1}/ \){pages.length}` : ''}`;
        const lines = [
            ...pages[index],
            ...(isLast ? ['', `_Use ${s.prefix}help <cmd> for details_`] : []),
        ];
        await sock.sendMessage(ctx.from, {
            text: menuBox(m.e, title, lines) + s.FOOTER,
            buttons: [{ buttonId: 'madara_back_menu', buttonText: { displayText: '⬅️ BACK TO MENU' }, type: 1 }],
            headerType: 1
        }, index === 0 && msg ? { quoted: msg } : {});
    }
}

async function sendCategoryDirectory(sock, msg, ctx) {
    const s = ctx.settings;
    const { getCategories } = require('../../lib/loader');
    const categories = getCategories();
    const catalog = getMenuCategoryCatalog(categories);
    const counts = getCategoryCounts(categories);
    const lines = Object.entries(catalog).map(([key, meta]) =>
        `\( {meta.e} * \){meta.l.toUpperCase()}* — ${counts[key] || 0} commands\n   ${s.prefix || '.'}categorymenu ${key}`
    );
    await sock.sendMessage(ctx.from, {
        text: menuBox('📂', 'ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅ ᴄᴀᴛᴇɢᴏʀɪᴇs', lines) + s.FOOTER,
        buttons: [{ buttonId: 'madara_back_menu', buttonText: { displayText: '⬅️ BACK TO MENU' }, type: 1 }],
        headerType: 1,
    }, { quoted: msg });
}

async function prepareMenuMedia(sock, senderId) {
    // Priority: custom image → custom video → random banner from assets/menu_banners
    try {
        if (fs.existsSync(MENU_IMG)) {
            return await prepareWAMessageMedia(
                { image: fs.readFileSync(MENU_IMG) },
                { upload: sock.waUploadToServer }
            );
        }
        if (fs.existsSync(MENU_VID)) {
            return await prepareWAMessageMedia(
                { video: fs.readFileSync(MENU_VID) },
                { upload: sock.waUploadToServer }
            );
        }
        const localBanner = getRandomBanner(senderId);
        if (localBanner && fs.existsSync(localBanner)) {
            return await prepareWAMessageMedia(
                { image: fs.readFileSync(localBanner) },
                { upload: sock.waUploadToServer }
            );
        }
    } catch (e) {
        console.log('[menu] media prepare failed:', e.message);
    }
    return null;
}

async function execute(sock, msg, args, ctx) {
    // === DESIGN ENGINE (per-user skin) ===
    try {
        const { getDesignIdFor, render } = require('../../lib/menuEngine');
        const chatId = msg.chat || ctx.from;
        const senderId = msg.key?.participant || msg.sender || ctx.sender || chatId;
        const skin = getDesignIdFor(chatId, senderId);

        if (skin && skin !== 'default') {
            try {
                await render(sock, msg, args, skin, ctx);
                return;
            } catch (e) {
                console.log('[MENU] design render failed → fallback to menu.js:', e.message);
                // fall through to default
            }
        }
    } catch (e) {
        console.log('[MENU] skin outer error:', e.message);
    }
    // === END DESIGN ENGINE ===

    const s = ctx.settings;
    const prefix = s.prefix || '.';
    const name = ctx.pushName || sc(s.ownerName);
    const uptime = clockString(process.uptime() * 1000);
    const now = new Date();
    const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const str =
`❤️ *_ʜᴇʟʟᴏ ${name}, ${greeting()}!_* 🥳
╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│𝙽𝚊𝚖𝚎: ${sc(s.botName)}
┃✰│𝚃𝚘𝚝𝚊𝚕: 700+ ғᴇᴀᴛᴜʀᴇs
┃✰│ᴠᴇʀꜱɪᴏɴ: v${sc(s.version)}
┃✰│ᴏᴡɴᴇʀ: *${sc(s.ownerName)}*
┃✰│ᴘʀᴇꜰɪx: *${prefix}*
┃✰│ᴜᴘᴛɪᴍᴇ: ${uptime}
┃✰│ᴅᴀᴛᴇ: ${date}
┃✰│ᴛɪᴍᴇ: ${time}
╰──────────────────

*Q̲ᴜɪᴄᴋ:* ${prefix}ʙᴏᴛᴍᴇɴᴜ | ${prefix}ɢʀᴏᴜᴘᴍᴇɴᴜ | ${prefix}ᴅʟᴍᴇɴᴜ`;

    // Optional menu audio
    if (fs.existsSync(MENU_AUDIO)) {
        try {
            await sock.sendMessage(ctx.from, {
                audio: fs.readFileSync(MENU_AUDIO),
                mimetype: 'audio/mpeg',
                ptt: false,
            }, { quoted: msg });
        } catch (e) {
            console.log('[menu] audio send failed:', e.message);
        }
    }

    const headerMedia = await prepareMenuMedia(sock, ctx.sender);

    const categoryRows = Object.entries(getMenuCategoryCatalog()).map(([key, meta]) => ({
        title: `${meta.e} ${meta.l}`,
        description: `View ${meta.l} commands`,
        id: `madara_cat_${key}`,
    }));
    const rows = [
        ...categoryRows,
        { title: '📢 CHANNEL', description: `Join ${s.botName} channel`, id: 'madara_channel' },
    ];

    const sections = [];
    for (let i = 0; i < rows.length; i += 10) {
        const page = Math.floor(i / 10) + 1;
        const totalPages = Math.ceil(rows.length / 10);
        sections.push({
            title: totalPages > 1 ? `CATEGORIES \( {page}/ \){totalPages}` : 'sᴇʟᴇᴄᴛ ᴄᴀᴛᴇɢᴏʀʏ',
            rows: rows.slice(i, i + 10),
        });
    }

    const menuMsg = generateWAMessageFromContent(ctx.from, {
        interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({ text: str }),
            footer: proto.Message.InteractiveMessage.Footer.create({
                text: `© Powered by ${s.botName}`
            }),
            header: proto.Message.InteractiveMessage.Header.create({
                title: `${sc(s.botName)}`,
                hasMediaAttachment: !!(headerMedia?.imageMessage || headerMedia?.videoMessage),
                imageMessage: headerMedia?.imageMessage || undefined,
                videoMessage: headerMedia?.videoMessage || undefined,
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({ display_text: '⚙️ SYSTEM', id: 'madara_cat_system' })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({ display_text: '👥 GROUP', id: 'madara_cat_group' })
                    },
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({ title: '📂 ᴍᴀᴅᴀʀᴀ ᴍᴇɴᴜ', sections })
                    }
                ]
            })
        })
    }, { quoted: msg });

    await sock.relayMessage(ctx.from, menuMsg.message, {
        messageId: menuMsg.key.id,
        additionalNodes: [{
            tag: 'biz', attrs: {},
            content: [{
                tag: 'interactive',
                attrs: { type: 'native_flow', v: '1' },
                content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
            }]
        }]
    });
}

module.exports = {
    name: 'menu',
    aliases: ['commands', 'cmds', 'help', 'h', 'main'],
    category: 'system',
    desc: 'sʜᴏᴡ ᴄᴏᴍᴀɴᴅ ᴍᴇɴᴜ',
    usage: '.menu',
    waitReact: false,
    execute,
    sendCategoryMenu,
    sendCategoryDirectory,
    splitMenuLines,
    CAT,
};