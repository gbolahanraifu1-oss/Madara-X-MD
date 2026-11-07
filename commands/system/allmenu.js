'use strict';
const { tokenizeCode } = require('@itsliaaa/baileys');
// Use your own quotedContext wey you show me before
const { quotedContext } = require('../../lib/utils');

async function runAllmenu(sock, from, msg) {
  try {
    const loader = require('../../lib/loader');
    const categories = loader.getCategories();
    const allCmds = loader.getAllCommands ? loader.getAllCommands() : null;

    let body = 'AI (3)\n• ai\n• aianalyze\n• aiart';
    let total = 0;
    if (categories?.size) {
      const blocks = [];
      for (const cat of [...categories.keys()].sort((a,b)=>a.localeCompare(b))) {
        const plugins = categories.get(cat)
          .filter((p,i,arr)=>arr.findIndex(x=>x.name===p.name)===i)
          .sort((a,b)=>a.name.localeCompare(b.name));
        if (!plugins.length) continue;
        total += plugins.length;
        blocks.push(`${cat.toUpperCase()} (${plugins.length})\n${plugins.map(p=>`• ${p.name}`).join('\n')}`);
      }
      body = blocks.join('\n\n');
    }
    if (body.length > 50000) body = body.slice(0, 50000);

    const header = `MADARA X-MD ALL COMMANDS\n${total || allCmds?.size || ''} commands - ${categories?.size || ''} categories`;

    // Same pattern as your .get command
    await sock.sendMessage(from, {
      disclaimerText: 'MADARA X-MD',
      richResponse: [
        { text: header },
        { language: 'javascript', code: tokenizeCode(body, 'javascript') }
      ],
      contextInfo: quotedContext
    }, { quoted: msg });

  } catch (e) {
    console.log('allmenu error', e);
    await sock.sendMessage(from, { text: 'ALLMENU ERROR:\n' + (e?.stack || e.message) });
  }
}

module.exports = {
  name: 'allmenu',
  aliases: ['allcmds', 'allcommands', 'cmdlist'],
  category: 'system',
  desc: 'List every command',
  run: async ({ sock, from, msg }) => runAllmenu(sock, from, msg),
  execute: async (sock, msg, args, ctx) => runAllmenu(sock, ctx.from || msg.key.remoteJid, msg),
};