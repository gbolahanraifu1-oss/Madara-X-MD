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
var DEFAULT_SKIN = 'pain';

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

function buildCategorySections(s) {
    var categoryRows = Object.entries(getMenuCategoryCatalog()).map(function (entry) {
        var key = entry[0];
        var meta = entry[1];
        return {
            title: String(meta.e + ' ' + meta.l).slice(0, 24),
            description: ('View ' + meta.l + ' commands').slice(0, 72),
            id: 'madara_cat_' + key
        };
    });

    var rows = categoryRows.concat([
        {
            title: '📢 CHANNEL',
            description: ('Join ' + (s.botName || 'Madara') + ' channel').slice(0, 72),
            id: 'madara_channel'
        }
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
    return sections;
}

async function sendDefaultInteractiveMenu(sock, msg, ctx, str, headerMedia, sections) {
    var s = ctx.settings;

    var menuMsg = generateWAMessageFromContent(ctx.from, {
        interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({ text: str }),
            footer: proto.Message.InteractiveMessage.Footer.create({
                text: '© Powered by ' + (s.botName || 'MADARA X-MD')
            }),
            header: proto.Message.InteractiveMessage.Header.create({
                title: sc(s.botName || 'MADARA'),
                hasMediaAttachment: !!(headerMedia && (headerMedia.imageMessage || headerMedia.videoMessage)),
                imageMessage: (headerMedia && headerMedia.imageMessage) || undefined,
                videoMessage: (headerMedia && headerMedia.videoMessage) || undefined
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                    {
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title: '📂 ᴍᴀᴅᴀʀᴀ ᴍᴇɴᴜ',
                            sections: sections
                        })
                    }
                ]
            })
        })
    }, { quoted: msg });

    await sock.relayMessage(ctx.from, menuMsg.message, {
        messageId: menuMsg.key.id,
        additionalNodes: [{
            tag: 'biz',
            attrs: {},
            content: [{
                tag: 'interactive',
                attrs: { type: 'native_flow', v: '1' },
                content: [{
                    tag: 'native_flow',
                    attrs: { v: '1', name: 'single_select' }
                }]
            }]
        }]
    });
}

async function sendDefaultFallbackMenu(sock, msg, ctx, str) {
    var s = ctx.settings;
    var sections = buildCategorySections(s);
    var lines = [];
    sections.forEach(function (sec) {
        sec.rows.forEach(function (row) {
            if (row.id === 'madara_channel') {
                lines.push(row.title + ' — channel');
            } else {
                var key = String(row.id || '').replace(/^madara_cat_/, '');
                lines.push(row.title + ' → ' + (s.prefix || '.') + 'categorymenu ' + key);
            }
        });
    });

    var body = str + '\n\n' + menuBox('📂', 'ᴄᴀᴛᴇɢᴏʀɪᴇs', lines) + (s.FOOTER || '');

    var banner = null;
    if (fs.existsSync(MENU_IMG)) banner = MENU_IMG;
    else {
        try {
            var pick = getRandomBanner(ctx.sender);
            if (pick && fs.existsSync(pick)) banner = pick;
        } catch (_) {}
    }

    if (banner) {
        await sock.sendMessage(ctx.from, {
            image: fs.readFileSync(banner),
            caption: body
        }, { quoted: msg });
        return;
    }
    if (fs.existsSync(MENU_VID)) {
        await sock.sendMessage(ctx.from, {
            video: fs.readFileSync(MENU_VID),
            mimetype: 'video/mp4',
            caption: body
        }, { quoted: msg });
        return;
    }
    await sock.sendMessage(ctx.from, { text: body }, { quoted: msg });
}

async function maybeSendMenuAudio(sock, from) {
    if (!fs.existsSync(MENU_AUDIO)) return;
    try {
        await sock.sendMessage(from, {
            audio: fs.readFileSync(MENU_AUDIO),
            mimetype: 'audio/mpeg',
            ptt: false
        });
    } catch (e) {
        console.log('[menu] audio send failed:', e.message);
    }
}

async function execute(sock, msg, args, ctx) {
    // ── Design engine: pain is the default skin ──
    try {
        var menuEngine = require('../../lib/menuEngine');
        var chatId = msg.chat || ctx.from;
        var senderId = (msg.key && msg.key.participant) || msg.sender || ctx.sender || chatId;
        var skin = menuEngine.getDesignIdFor(chatId, senderId);

        // Force pain when unset / default
        if (!skin || skin === 'default') skin = DEFAULT_SKIN;

        try {
            await menuEngine.render(sock, msg, args, skin, ctx);
            await maybeSendMenuAudio(sock, ctx.from);
            return;
        } catch (e) {
            console.log('[MENU] design "' + skin + '" failed → stock fallback:', e.message);
            // If preferred skin failed and it wasn't pain, try pain once
            if (skin !== DEFAULT_SKIN) {
                try {
                    await menuEngine.render(sock, msg, args, DEFAULT_SKIN, ctx);
                    await maybeSendMenuAudio(sock, ctx.from);
                    return;
                } catch (e2) {
                    console.log('[MENU] pain fallback also failed:', e2.message);
                }
            }
        }
    } catch (e) {
        console.log('[MENU] skin outer error:', e.message);
    }

    // ── Stock interactive / media fallback (only if pain + design engine dead) ──
    var s = ctx.settings;
    var prefix = s.prefix || '.';
    var name = ctx.pushName || sc(s.ownerName);
    var uptime = clockString(process.uptime() * 1000);
    var now = new Date();
    var date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    var time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    var str =
        '❤️ *_ʜᴇʟʟᴏ ' + name + ', ' + greeting() + '!_* 🥳\n' +
        '╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═⊷❍\n' +
        '┃✰│𝙽𝚊𝚖𝚎: ' + sc(s.botName) + '\n' +
        '┃✰│𝚃𝚘𝚝𝚊𝚕: 1688+ ғᴇᴀᴛᴜʀᴇs\n' +
        '┃✰│ᴠᴇʀꜱɪᴏɴ: v' + sc(s.version) + '\n' +
        '┃✰│ᴏᴡɴᴇʀ: *' + sc(s.ownerName) + '*\n' +
        '┃✰│ᴘʀᴇꜰɪx: *' + prefix + '*\n' +
        '┃✰│ᴜᴘᴛɪᴍᴇ: ' + uptime + '\n' +
        '┃✰│ᴅᴀᴛᴇ: ' + date + '\n' +
        '┃✰│ᴛɪᴍᴇ: ' + time + '\n' +
        '╰──────────────────\n\n' +
        '*Q̲ᴜɪᴄᴋ:* ' + prefix + 'ʙᴏᴛᴍᴇɴᴜ | ' + prefix + 'ɢʀᴏᴜᴘᴍᴇɴᴜ | ' + prefix + 'ᴅʟᴍᴇɴᴜ | ' + prefix + 'ɢᴀᴍᴇs';

    var headerMedia = await prepareMenuMedia(sock, ctx.sender);
    var sections = buildCategorySections(s);

    var menuSent = false;
    try {
        await sendDefaultInteractiveMenu(sock, msg, ctx, str, headerMedia, sections);
        menuSent = true;
    } catch (e) {
        console.error('[menu] interactive failed → media/text fallback:', e.message);
        try {
            await sendDefaultFallbackMenu(sock, msg, ctx, str);
            menuSent = true;
        } catch (e2) {
            console.error('[menu] fallback failed:', e2.message);
            await sock.sendMessage(ctx.from, { text: str + (s.FOOTER || '') }, { quoted: msg });
            menuSent = true;
        }
    }

    if (menuSent) await maybeSendMenuAudio(sock, ctx.from);
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
