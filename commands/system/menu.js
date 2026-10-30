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
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ',
    k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'Q', r: 'ʀ', s: 's', t: 'ᴛ',
    u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
};
function sc(str) {
    return String(str).toLowerCase().split('').map(function (c) {
        return _SC[c] || c;
    }).join('');
}
function clockString(ms) {
    var h = Math.floor(ms / 3600000);
    var m = Math.floor(ms / 60000) % 60;
    var s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(function (v) {
        return String(v).padStart(2, '0');
    }).join(':');
}

var MENU_IMG = path.join(process.cwd(), 'assets', 'menuimage.jpg');
var MENU_VID = path.join(process.cwd(), 'assets', 'menuvideo.mp4');
var MENU_AUDIO = path.join(process.cwd(), 'assets', 'menu_audio.mp3');

function greeting() {
    var h = new Date().getHours();
    if (h < 4) return 'ʜᴀᴘᴘʏ ᴇᴀʀʟʏ ʜᴏᴜʀs ✨';
    if (h < 10) return 'ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ 🥱';
    if (h < 15) return 'ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ 🫠';
    if (h < 18) return 'ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ 🌇';
    return 'ɢᴏᴏᴅ ɴɪɢʜᴛ 🌙';
}

async function sendCategoryMenu(sock, msg, ctx, catKey) {
    if (String(catKey).trim().toLowerCase() === 'more') {
        return sendCategoryDirectory(sock, msg, ctx);
    }
    var s = ctx.settings;
    catKey = resolveCategory(catKey);
    var m = getCategoryMeta(catKey);
    if (!m) return ctx.reply('❌ Unknown category: ' + catKey + s.FOOTER);

    var getCategories = require('../../lib/loader').getCategories;
    var cmds = (getCategories().get(catKey) || [])
        .filter(function (c, i, arr) {
            return arr.findIndex(function (x) { return x.name === c.name; }) === i;
        })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });

    if (!cmds.length) return ctx.reply('📭 No commands found in *' + m.l + '*.' + s.FOOTER);

    var pages = splitMenuLines(cmds.map(function (c) {
        return (s.prefix || '.') + c.name;
    }));

    for (var index = 0; index < pages.length; index++) {
        var isLast = index === pages.length - 1;
        var title = m.l.toUpperCase() + ' ᴄᴏᴍᴀɴᴅs';
        if (pages.length > 1) title += ' · ' + (index + 1) + '/' + pages.length;

        var lines = pages[index].slice();
        if (isLast) {
            lines.push('');
            lines.push('_Use ' + s.prefix + 'help <cmd> for details_');
        }

        await sock.sendMessage(ctx.from, {
            text: menuBox(m.e, title, lines) + s.FOOTER,
            buttons: [{ buttonId: 'madara_back_menu', buttonText: { displayText: '⬅️ BACK TO MENU' }, type: 1 }],
            headerType: 1
        }, index === 0 && msg ? { quoted: msg } : {});
    }
}

async function sendCategoryDirectory(sock, msg, ctx) {
    var s = ctx.settings;
    var getCategories = require('../../lib/loader').getCategories;
    var categories = getCategories();
    var catalog = getMenuCategoryCatalog(categories);
    var counts = getCategoryCounts(categories);
    var lines = Object.entries(catalog).map(function (entry) {
        var key = entry[0];
        var meta = entry[1];
        return meta.e + ' *' + meta.l.toUpperCase() + '* — ' + (counts[key] || 0) +
            ' commands\n   ' + (s.prefix || '.') + 'categorymenu ' + key;
    });
    await sock.sendMessage(ctx.from, {
        text: menuBox('📂', 'ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅ ᴄᴀᴛᴇɢᴏʀɪᴇs', lines) + s.FOOTER,
        buttons: [{ buttonId: 'madara_back_menu', buttonText: { displayText: '⬅️ BACK TO MENU' }, type: 1 }],
        headerType: 1
    }, { quoted: msg });
}

async function prepareMenuMedia(sock, senderId) {
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
        var localBanner = getRandomBanner(senderId);
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
    // Design engine
    try {
        var menuEngine = require('../../lib/menuEngine');
        var chatId = msg.chat || ctx.from;
        var senderId = (msg.key && msg.key.participant) || msg.sender || ctx.sender || chatId;
        var skin = menuEngine.getDesignIdFor(chatId, senderId);

        if (skin && skin !== 'default') {
            try {
                await menuEngine.render(sock, msg, args, skin, ctx);
                return;
            } catch (e) {
                console.log('[MENU] design render failed → fallback:', e.message);
            }
        }
    } catch (e) {
        console.log('[MENU] skin outer error:', e.message);
    }

    var s = ctx.settings;
    var prefix = s.prefix || '.';
    var name = ctx.pushName || sc(s.ownerName);
    var uptime = clockString(process.uptime() * 1000);
    var now = new Date();
    var date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    var time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    var str =
        '❤️ *_ʜᴇʟʟᴏ ' + name + ', ' + greeting() + '!_* 🥳\n' +
        '╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍\n' +
        '┃✰│𝙽𝚊𝚖𝚎: ' + sc(s.botName) + '\n' +
        '┃✰│𝚃𝚘𝚝𝚊𝚕: 700+ ғᴇᴀᴛᴜʀᴇs\n' +
        '┃✰│ᴠᴇʀꜱɪᴏɴ: v' + sc(s.version) + '\n' +
        '┃✰│ᴏᴡɴᴇʀ: *' + sc(s.ownerName) + '*\n' +
        '┃✰│ᴘʀᴇꜰɪx: *' + prefix + '*\n' +
        '┃✰│ᴜᴘᴛɪᴍᴇ: ' + uptime + '\n' +
        '┃✰│ᴅᴀᴛᴇ: ' + date + '\n' +
        '┃✰│ᴛɪᴍᴇ: ' + time + '\n' +
        '╰──────────────────\n\n' +
        '*Q̲ᴜɪᴄᴋ:* ' + prefix + 'ʙᴏᴛᴍᴇɴᴜ | ' + prefix + 'ɢʀᴏᴜᴘᴍᴇɴᴜ | ' + prefix + 'ᴅʟᴍᴇɴᴜ';

    var headerMedia = await prepareMenuMedia(sock, ctx.sender);

    var categoryRows = Object.entries(getMenuCategoryCatalog()).map(function (entry) {
        var key = entry[0];
        var meta = entry[1];
        return {
            title: meta.e + ' ' + meta.l,
            description: 'View ' + meta.l + ' commands',
            id: 'madara_cat_' + key
        };
    });
    var rows = categoryRows.concat([
        { title: '📢 CHANNEL', description: 'Join ' + s.botName + ' channel', id: 'madara_channel' }
    ]);

    var sections = [];
    for (var i = 0; i < rows.length; i += 10) {
        var page = Math.floor(i / 10) + 1;
        var totalPages = Math.ceil(rows.length / 10);
        sections.push({
            title: totalPages > 1 ? ('CATEGORIES ' + page + '/' + totalPages) : 'sᴇʟᴇᴄᴛ ᴄᴀᴛᴇɢᴏʀʏ',
            rows: rows.slice(i, i + 10)
        });
    }

    var menuMsg = generateWAMessageFromContent(ctx.from, {
        interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({ text: str }),
            footer: proto.Message.InteractiveMessage.Footer.create({
                text: '© Powered by ' + s.botName
            }),
            header: proto.Message.InteractiveMessage.Header.create({
                title: sc(s.botName),
                hasMediaAttachment: !!(headerMedia && (headerMedia.imageMessage || headerMedia.videoMessage)),
                imageMessage: (headerMedia && headerMedia.imageMessage) || undefined,
                videoMessage: (headerMedia && headerMedia.videoMessage) || undefined
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
                        buttonParamsJson: JSON.stringify({ title: '📂 ᴍᴀᴅᴀʀᴀ ᴍᴇɴᴜ', sections: sections })
                    }
                ]
            })
        })
    }, { quoted: msg });

    // 1) MENU FIRST
    await sock.relayMessage(ctx.from, menuMsg.message, {
        messageId: menuMsg.key.id,
        additionalNodes: [{
            tag: 'biz',
            attrs: {},
            content: [{
                tag: 'interactive',
                attrs: { type: 'native_flow', v: '1' },
                content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
            }]
        }]
    });

    // 2) AUDIO AFTER MENU
    if (fs.existsSync(MENU_AUDIO)) {
        try {
            await sock.sendMessage(ctx.from, {
                audio: fs.readFileSync(MENU_AUDIO),
                mimetype: 'audio/mpeg',
                ptt: false
            });
        } catch (e) {
            console.log('[menu] audio send failed:', e.message);
        }
    }
}

module.exports = {
    name: 'menu',
    aliases: ['commands', 'cmds', 'help', 'h', 'main'],
    category: 'system',
    desc: 'sʜᴏᴡ ᴄᴏᴍᴀɴᴅ ᴍᴇɴᴜ',
    usage: '.menu',
    waitReact: false,
    execute: execute,
    sendCategoryMenu: sendCategoryMenu,
    sendCategoryDirectory: sendCategoryDirectory,
    splitMenuLines: splitMenuLines,
    CAT: CAT
};