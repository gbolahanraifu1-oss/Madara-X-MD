'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'setmenu',
  aliases: ['design', 'setdesign', 'md'],
  category: 'system',
  desc: 'switch menu design - per user',

  execute: async (sock, msg, args, ctx) => {
    const { listDesigns, PREF_FILE, DESIGN_DIR } = require('../../lib/menuEngine');

    if (!fs.existsSync(DESIGN_DIR)) fs.mkdirSync(DESIGN_DIR, { recursive: true });
    if (!fs.existsSync(PREF_FILE)) fs.writeFileSync(PREF_FILE, JSON.stringify({ default: "default" }, null, 2));

    let pref = {};
    try { pref = JSON.parse(fs.readFileSync(PREF_FILE, 'utf8')); } catch { pref = { default: "default" }; }

    const chatId = msg.chat || ctx.from;
    const senderId = msg.key?.participant || msg.sender || ctx.sender || chatId;
    const available = listDesigns();

    const ALIAS = { 'apex': 'madara-apex', 'madara': 'madara-apex', 'default': 'default', 'old': 'default' };
    const cur = pref[senderId] || pref['default'] || 'default';

    if (!args[0]) {
      return await sock.sendMessage(chatId, { text: `*🎨 DESIGN*\nAvailable: ${available.join(', ')}\nYour: ${cur}\n\n.setmenu apex\n.setmenu default` });
    }

    let raw = args[0].toLowerCase();
    let choice = ALIAS[raw] || raw;
    if (!available.includes(choice)) {
      const f = available.find(d => d.toLowerCase().includes(choice));
      if (f) choice = f;
    }
    if (!available.includes(choice)) {
      return await sock.sendMessage(chatId, { text: `❌ Invalid "${raw}"\nAvailable: ${available.join(', ')}` });
    }

    const wantsGlobal = args[1] && ['global', 'all'].includes(args[1].toLowerCase());
    if (wantsGlobal) {
      // DEV ONLY - uses your handler's owner check, no config import
      const isDev = ctx.isDev || ctx.isOwner || (ctx.settings && ctx.settings.ownerNumber && String(senderId).includes(String(ctx.settings.ownerNumber).replace(/[^0-9]/g,'')));
      if (!isDev) return await sock.sendMessage(chatId, { text: `❌ Global is DEV only.\nUse:.setmenu apex` });
      pref['default'] = choice;
      fs.writeFileSync(PREF_FILE, JSON.stringify(pref, null, 2));
      return await sock.sendMessage(chatId, { text: `✅ GLOBAL menu set to *${choice}* (DEV)` });
    }

    if (choice === 'default') delete pref[senderId];
    else pref[senderId] = choice;

    fs.writeFileSync(PREF_FILE, JSON.stringify(pref, null, 2));
    await sock.sendMessage(chatId, { text: `✅ Your menu set to *${choice}*` });
  }
};