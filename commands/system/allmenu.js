'use strict';

const { quotedContext } = require('../../lib/utils');
const { menuBox } = require('../../lib/menuBox');

module.exports = {
    name: 'allmenu',
    aliases: ['allcmds', 'allcommands', 'cmdlist'],
    category: 'system',
    desc: 'List every command in the bot, grouped by category',
    usage: '.allmenu',

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings || {};
        const prefix = s.prefix || '.';
        const footer = s.FOOTER || '';
        const { getCategories, getAllCommands } = require('../../lib/loader');

        const categories = getCategories();
        const allCmds = getAllCommands();
        const totalCmds = allCmds?.size ?? 0;

        if (!categories?.size) {
            return ctx.reply(`❌ No commands loaded right now.${footer}`);
        }

        const sortedCats = [...categories.keys()].sort((a, b) => a.localeCompare(b));
        const data = {
            total_commands: totalCmds,
            total_categories: sortedCats.length,
            generated_at: new Date().toISOString(),
            categories: {},
        };

        for (const cat of sortedCats) {
            const plugins = (categories.get(cat) || [])
                .filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i)
                .sort((a, b) => a.name.localeCompare(b.name));

            data.categories[cat] = plugins.map(p => ({
                command: `${prefix}${p.name}`,
                category: cat,
            }));
        }

        const code = JSON.stringify(data, null, 2);
        // WhatsApp hard-limits message size — keep payload sane
        const body = code.length > 5500
            ? `${code.slice(0, 5500)}\n… (truncated)`
            : code;

        const text =
            menuBox('📦', 'ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅs', [
                `*${totalCmds}* commands · *${sortedCats.length}* categories`,
                ``,
                '```json',
                body,
                '```',
            ]) + footer;

        try {
            await sock.sendMessage(ctx.from, {
                text,
                contextInfo: quotedContext,
            }, { quoted: msg });
        } catch (e) {
            // Fallback without fake-forward context if WA rejects it
            await ctx.reply(text);
        }
    },
};
