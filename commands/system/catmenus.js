'use strict';
const { menuBox } = require('../../lib/menuBox');
const {
    CATEGORY_META: CAT,
    toSmallCaps: sc,
    getMenuCategoryCatalog,
    getCategoryCounts,
    resolveCategory,
} = require('../../lib/menuCategories');

function greet() {
    const h = new Date().getHours();
    return h<12?'ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ':h<17?'ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ':'ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ';
}

const categoryPlugins = Object.entries(CAT).filter(([key]) => key !== 'economy').map(([key, m]) => ({
    name:     `${key}menu`,
    aliases:  [`${key}cmds`],
    category: 'system',
    desc:     `sʜᴏᴡ ${m.l} ᴍᴇɴᴜ`,
    usage:    `.${key}menu`,
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const { getCategories } = require('../../lib/loader');
        const s    = ctx.settings;
        const cats = getCategories();
        const cmds = cats.get(key) || [];

        if (!cmds.length)
            return sock.sendMessage(ctx.from,
                {text: menuBox('❌', `${m.l} ᴍᴇɴᴜ`, [`ɴᴏ ᴄᴏᴍᴍᴀɴᴅs ɪɴ *${sc(key)}*.`]) + s.FOOTER},
                {quoted:msg});

        const lines = cmds.map(c => `_${s.prefix}${sc(c.name)}_`);
        const text  = menuBox(m.e, `${m.l} ᴍᴇɴᴜ`, lines) + s.FOOTER;

        await sock.sendMessage(ctx.from, {text}, {quoted:msg});
    }
}));

const categoryDirectoryPlugin = {
    name: 'categorymenu',
    aliases: ['catmenu', 'category'],
    category: 'system',
    desc: 'sʜᴏᴡ ᴀɴʏ ᴄᴏᴍᴍᴀɴᴅ ᴄᴀᴛᴇɢᴏʀʏ',
    usage: '.categorymenu [category]',
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const { sendCategoryMenu, sendCategoryDirectory } = require('./menu');
        const rawRequested = String(args?.[0] || '').trim();
        const requested = rawRequested ? resolveCategory(rawRequested) : '';
        if (!requested || requested === 'all' || requested === 'list' || requested === 'more') {
            return sendCategoryDirectory(sock, msg, ctx);
        }

        const categories = require('../../lib/loader').getCategories();
        const catalog = getMenuCategoryCatalog(categories);
        const counts = getCategoryCounts(categories);
        if (!catalog[requested]) {
            const names = Object.entries(catalog).map(([key, meta]) =>
                `${meta.e} ${meta.l} (${counts[key] || 0})`
            );
            return sock.sendMessage(ctx.from, {
                text: menuBox('📂', 'ᴀᴠᴀɪʟᴀʙʟᴇ ᴄᴀᴛᴇɢᴏʀɪᴇs', names) +
                    `\n\nUse ${ctx.settings.prefix || '.'}categorymenu <category>.` +
                    (ctx.settings.FOOTER || ''),
            }, { quoted: msg });
        }
        return sendCategoryMenu(sock, msg, ctx, requested);
    },
};

module.exports = [...categoryPlugins, categoryDirectoryPlugin];