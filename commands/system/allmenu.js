
'use strict';
const { quotedContext} = require('../../lib/utils');

module.exports = {
name: 'allmenu',
aliases: ['allcmds', 'allcommands', 'cmdlist'],
category: 'system',
desc: 'List every command in the bot, grouped by category',
usage: '.allmenu',

async execute(sock, msg, args, ctx) {

const { getCategories, getAllCommands} = require('../../lib/loader');

const categories = getCategories();
const allCmds = getAllCommands();
const totalCmds = allCmds?.size?? 0;

if (!categories?.size) return ctx.reply('❌ No commands loaded right now.');

const sortedCats = [...categories.keys()].sort((a, b) => a.localeCompare(b));
const blocks = [];

for (const cat of sortedCats) {
const plugins = categories.get(cat)
.filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i)
.sort((a, b) => a.name.localeCompare(b.name));

if (!plugins.length) continue;
blocks.push(`_${cat.toUpperCase()}_ (${plugins.length})\n${plugins.map(p => `• ${p.name}`).join('\n')}`);
}

let body = blocks.join('\n\n');
const MAX = 60000;
if (body.length > MAX) body = `${body.slice(0, MAX)}\n… (truncated)`;

const text = `📦 _MADARA X-MD ALL COMMANDS_\n\n_${totalCmds}_ commands · _${sortedCats.length}_ categories\n\n${body}`;

try {
await sock.sendMessage(ctx.from, {
text,
contextInfo: quotedContext
}, { quoted: msg});
} catch (e) {
await ctx.reply(text);
}
}
};