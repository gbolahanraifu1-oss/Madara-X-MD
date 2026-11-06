'use strict';


module.exports = {
name: 'allmenu',
aliases: ['allcmds', 'allcommands', 'cmdlist'],
category: 'system',
desc: 'List every command in the bot, grouped by category',
usage: '.allmenu',

async execute(sock, msg, args, ctx) {
const s = ctx.settings;
const { getCategories, getAllCommands } = require('../../lib/loader');

const categories = getCategories();
const allCmds = getAllCommands();
const totalCmds = allCmds.size;

if (!categories.size) return sock.sendMessage(ctx.from, {
text: `❌ No commands loaded right now.${s.FOOTER}`,
contextInfo: quotedContext
}, { quoted: msg });

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
description: p.desc || p.description || 'No description',
category: cat
}));
}

// Pretty print like .get does
const code = JSON.stringify(data, null, 2);

// Chunk if too long for one message
const CHUNK_LIMIT = 3500;
const messages = [];
for (let i = 0; i < code.length; i += CHUNK_LIMIT) {
messages.push(code.slice(i, i + CHUNK_LIMIT));
}

for (let i = 0; i < messages.length; i++) {
const pageTag = messages.length > 1 ? `\n_page ${i + 1}/${messages.length}_` : '';
const finalText = `📦 *ALL COMMANDS* — ${totalCmds} total across ${sortedCats.length} categories\n\n${messages[i]}${pageTag}${i === messages.length - 1 ? s.FOOTER : ''}`;

await sock.sendMessage(ctx.from, {
text: finalText,
contextInfo: quotedContext
}, { quoted: msg });
}
}
};
