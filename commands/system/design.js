'use strict';
const fs = require('fs');

module.exports = {
  name: 'setmenu',
  aliases: ['design', 'setdesign', 'md'],
  category: 'system',
  desc: 'switch menu design - per user',

  execute: async (sock, msg, args, ctx) => {
    const { listDesigns, PREF_FILE, DESIGN_DIR } = require('../../lib/menuEngine');

    if (!fs.existsSync(DESIGN_DIR)) fs.mkdirSync(DESIGN_DIR, { recursive: true });
    if (!fs.existsSync(PREF_FILE)) {
      fs.writeFileSync(PREF_FILE, JSON.stringify({ default: 'default' }, null, 2));
    }

    let pref = {};
    try { pref = JSON.parse(fs.readFileSync(PREF_FILE, 'utf8')); }
    catch { pref = { default: 'default' }; }

    const chatId = msg.chat || ctx.from;
    const senderId = msg.key?.participant || msg.sender || ctx.sender || chatId;

    // Always include "default" so users can revert to menu.js
    const available = ['default', ...listDesigns().filter(d => d !== 'default')];

    const ALIAS = {
      apex: 'madara-apex',
      madara: 'madara-apex',
      default: 'default',
      old: 'default',
      normal: 'default',
      original: 'default',
    };

    const cur = pref[senderId] || pref.default || 'default';

    if (!args[0]) {
      return sock.sendMessage(chatId, {
        text:
          `*🎨 MADARA DESIGNS*\n` +
          `Available: ${available.join(', ')}\n` +
          `Your: *${cur}*\n\n` +
          `.setmenu default\n` +
          `.setmenu neon\n` +
          `.setmenu cyber`
      });
    }

    let raw = String(args[0]).toLowerCase().trim();
    let choice = ALIAS[raw] || raw;

    if (choice !== 'default' && !available.includes(choice)) {
      const f = available.find(d => d.toLowerCase().includes(choice));
      if (f) choice = f;
    }

    if (choice !== 'default' && !available.includes(choice)) {
      return sock.sendMessage(chatId, {
        text: `❌ Invalid "${raw}"\nAvailable: ${available.join(', ')}`
      });
    }

    const wantsGlobal = args[1] && ['global', 'all'].includes(String(args[1]).toLowerCase());
    if (wantsGlobal) {
      const isDev =
        ctx.isDev ||
        ctx.isOwner ||
        (ctx.settings?.ownerNumber &&
          String(senderId).includes(String(ctx.settings.ownerNumber).replace(/[^0-9]/g, '')));

      if (!isDev) {
        return sock.sendMessage(chatId, {
          text: `❌ Global is DEV only.\nUse: .setmenu ${choice}`
        });
      }

      pref.default = choice;
      fs.writeFileSync(PREF_FILE, JSON.stringify(pref, null, 2));
      return sock.sendMessage(chatId, {
        text: `✅ GLOBAL menu set to *${choice}* (DEV)`
      });
    }

    // Per-user preference — "default" masks a non-default global skin
    pref[senderId] = choice;
    fs.writeFileSync(PREF_FILE, JSON.stringify(pref, null, 2));

    await sock.sendMessage(chatId, {
      text: choice === 'default'
        ? `✅ Your menu is back to the original *menu.js* (banners + audio).`
        : `✅ Your menu set to *${choice}*`
    });
  }
};