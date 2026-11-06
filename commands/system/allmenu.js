'use strict';

const crypto = require('crypto');
const { generateWAMessageFromContent} = require('@itsliaaa/baileys');
const font = require('../utils/fontSystem'); // FIXED: correct path

module.exports = {
name: 'allmenu',
aliases: ['allcmds', 'allcommands', 'cmdlist'],
category: 'system',
desc: 'List every command in the bot, grouped by category',
usage: '†allmenu',

async execute(sock, msg, args, ctx) {
const s = ctx.settings;
const { getCategories, getAllCommands} = require('../../lib/loader');

const categories = getCategories();
const allCmds = getAllCommands();
const totalCmds = allCmds.size;

if (!categories.size) {
return ctx.reply(`❌ No commands loaded right now.${s.FOOTER}`);
}

const sortedCats = [...categories.keys()].sort((a, b) => a.localeCompare(b));
let blocks = [];
let header = `📦 *ALL COMMANDS* — ${totalCmds} total across ${sortedCats.length} categories\n`;

for (const cat of sortedCats) {
const plugins = categories.get(cat)
.filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i)
.sort((a, b) => a.name.localeCompare(b.name));
if (!plugins.length) continue;

const lines = plugins.map(p => `${s.prefix}${p.name}`).join(' • ');
blocks.push(`\n*── ${cat.toUpperCase()} (${plugins.length}) ──*\n${lines}\n`);
}

const fullText = header + blocks.join('');

const data = Buffer.from(JSON.stringify({
__typename: 'GenAIUnifiedResponse',
response_id: crypto.randomUUID(),
sections: [{
__typename: 'GenAIUnifiedResponseSection',
view_model: {
__typename: 'GenAISingleLayoutViewModel',
primitive: {
__typename: 'FOAHtmlPrimitiveDemoDONOTUSE',
trusted_sources: [],
payload: `<div style="background:#0a2e22;color:#e3dfbb;padding:14px;border-radius:16px;border:2px solid #b9954d;font-family:monospace;white-space:pre-wrap;">${fullText.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`,
},
},
}],
})).toString('base64');

const content = {
messageContextInfo: {
threadId: [],
deviceListMetadata: {
senderKeyIndexes: [],
recipientKeyIndexes: [],
recipientKeyHash: '',
recipientTimestamp: Math.floor(Date.now() / 1000),
},
deviceListMetadataVersion: 2,
messageSecret: crypto.randomBytes(32),
},
botForwardedMessage: {
message: {
richResponseMessage: {
messageType: 1,
submessages: [],
unifiedResponse: { data},
contextInfo: {
forwardingScore: 1,
isForwarded: true,
forwardedAiBotMessageInfo: { botJid: '867051314767696@bot'},
forwardOrigin: 4,
stanzaId: msg.key.id,
participant: msg.key.participant || msg.key.remoteJid,
...(msg.message? { quotedMessage: msg.message}: {}),
},
},
},
},
};

const wrapped = generateWAMessageFromContent(ctx.from, content, {
userJid: sock.user?.id,
quoted: msg
});

await sock.relayMessage(ctx.from, wrapped.message, { messageId: wrapped.key.id});
}
};