'use strict';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  ALLMENU
// Lists every loaded command, grouped by category — pulled live from
// lib/loader's registry so it's always accurate (no hardcoded list to
// go stale as commands get added/removed). This command was advertised
// in .menu's quick-links but never actually existed as a file — same
// story for .botmenu/.groupmenu/etc, which are still missing.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CHUNK_LIMIT = 3500; // chars per message — keeps well under any WA limit

module.exports = {
    name: 'allmenu',
    aliases: ['allcmds', 'allcommands', 'cmdlist'],
    category: 'system',
    desc: 'List every command in the bot, grouped by category',
    usage: '†allmenu',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const { getCategories, getAllCommands } = require('../../lib/loader');

        const categories = getCategories();
        const allCmds    = getAllCommands();
        const totalCmds  = allCmds.size;

        if (!categories.size) return ctx.reply(`❌ No commands loaded right now.${s.FOOTER}`);

        // Build one big block, category by category, sorted alphabetically.
        const sortedCats = [...categories.keys()].sort((a, b) => a.localeCompare(b));
        let blocks = [];
        let header = `📦 *ALL COMMANDS* — ${totalCmds} total across ${sortedCats.length} categories\n`;

        for (const cat of sortedCats) {
            const plugins = categories.get(cat)
                .filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i) // dedupe
                .sort((a, b) => a.name.localeCompare(b.name));
            if (!plugins.length) continue;

            const lines = plugins.map(p => `${s.prefix}${p.name}`).join(' • ');
            blocks.push(`\n*── ${cat.toUpperCase()} (${plugins.length}) ──*\n${lines}\n`);
        }

        // Chunk into multiple messages if it's too long for one.
        let current = header;
        const messages = [];
        for (const block of blocks) {
            if ((current + block).length > CHUNK_LIMIT) {
                messages.push(current);
                current = block;
            } else {
                current += block;
            }
        }
        if (current.trim()) messages.push(current);

        for (let i = 0; i < messages.length; i++) {
            const pageTag = messages.length > 1 ? `\n_page ${i + 1}/${messages.length}_` : '';
            await sock.sendMessage(ctx.from, { text: messages[i] + pageTag + (i === messages.length - 1 ? s.FOOTER : '') }, { quoted: msg });
        }
    }
};
