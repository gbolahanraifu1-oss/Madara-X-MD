'use strict';
import { quotedContext} from '../utils'; // adjust path if needed

module.exports = {
name: 'allmenu',
aliases: ['allcmds', 'allcommands', 'cmdlist'],
category: 'system',
desc: 'List every command in the bot, grouped by category',
usage: '.allmenu',

async execute(sock, msg, args, ctx) {
const s = ctx.settings;
const { getCategories, getAllCommands} = require('../../lib/loader');

const categories = getCategories();
const allCmds = getAllCommands();
const totalCmds = allCmds.size;

if (!categories.size) return sock.sendMessage(ctx.from, {
text: `❌ No commands loaded right now.${s.FOOTER}`,
contextInfo: quotedContext
}, { quoted: msg});

// Build the full data object like get format does
const sortedCats = [...categories.keys()].sort((a, b) => a.localeCompare(b));
const data = {
total_commands: totalCmds,
total_categories: sortedCats.length,
generated_at: new Date().toISOString(),
categories: {}
};

for (const cat of sortedCats) {
const plugins = categories.get(cat)
.filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i) // dedupe
.sort((a, b) => a.name.localeCompare(b.name));

data.categories[cat] = plugins.map(p => ({
command: `${s.prefix}${p.name}`,

category: cat
}));
}

// Pretty print + code block, no pagination
const code = JSON.stringify(data, null, 2);
const finalText = `📦 _ALL COMMANDS_ — ${totalCmds} total across ${sortedCats.length} categories\n\n\`\`\`json\n${code}\n\`\`\`${s.FOOTER}`;

await sock.sendMessage(ctx.from, {
text: finalText,
contextInfo: quotedContext
}, { quoted: msg});
}
};
