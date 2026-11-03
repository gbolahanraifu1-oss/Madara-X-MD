'use strict';
const fs = require('fs');

module.exports = {
  name: 'setmenu',
  aliases: ['design', 'setdesign', 'md'],
  category: 'system',
  desc: 'Switch menu design — per user (or global DEV)',
  usage: '.setmenu | .setmenu <name> | .setmenu <name> global',

  execute: async (sock, msg, args, ctx) => {
    const { listDesigns, PREF_FILE, DESIGN_DIR } = require('../../lib/menuEngine');
    const s = (ctx && ctx.settings) || {};
    const footer = s.FOOTER || '';

    if (!fs.existsSync(DESIGN_DIR)) fs.mkdirSync(DESIGN_DIR, { recursive: true });
    if (!fs.existsSync(PREF_FILE)) {
      fs.writeFileSync(PREF_FILE, JSON.stringify({ default: 'default' }, null, 2));
    }

    let pref = {};
    try { pref = JSON.parse(fs.readFileSync(PREF_FILE, 'utf8')); }
    catch { pref = { default: 'default' }; }

    const chatId = msg.chat || ctx.from;
    const senderId = msg.key?.participant || msg.sender || ctx.sender || chatId;

    const available = ['default', ...listDesigns().filter((d) => d !== 'default')];

    const ALIAS = {
      apex: 'madara-apex',
      madara: 'madara-apex',
      premium: 'madara-premium',
      pmenu: 'madara-premium',
      cmdcenter: 'madara-premium',
      default: 'default',
      old: 'default',
      normal: 'default',
      original: 'default',
      menu: 'default',
    };

    const LABEL = {
      default: 'Default (menu.js)',
      'madara-apex': 'Apex · A2UI Command Center',
      'madara-premium': 'Premium · Full lists + A2UI',
    };

    function prettyName(id) {
      if (LABEL[id]) return LABEL[id];
      return id
        .replace(/^madara-/, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const cur = pref[senderId] || pref.default || 'default';
    const globalCur = pref.default || 'default';

    // ── LIST ─────────────────────────────────────────────────────────
    if (!args[0]) {
      const lines = available.map((id) => {
        const mark = id === cur ? '✅' : '○';
        const g = id === globalCur ? ' · global' : '';
        return `${mark}  *${id}*${g}\n    └ ${prettyName(id)}`;
      });

      const text =
        `╔══════════════════════════╗\n` +
        `║   🎨 *MADARA MENU SKINS*  ║\n` +
        `╚══════════════════════════╝\n\n` +
        `*Your skin:* \`${cur}\`\n` +
        `*Global:* \`${globalCur}\`\n\n` +
        `┌─〔 Available 〕\n` +
        lines.join('\n\n') +
        `\n└────────────────\n\n` +
        `*Usage*\n` +
        `▸ \`.setmenu apex\`\n` +
        `▸ \`.setmenu premium\`\n` +
        `▸ \`.setmenu default\`\n` +
        `▸ \`.setmenu <name> global\` _(DEV)_\n\n` +
        `_Aliases: apex → madara-apex · premium → madara-premium_` +
        footer;

      return sock.sendMessage(chatId, { text });
    }

    // ── SET ──────────────────────────────────────────────────────────
    let raw = String(args[0]).toLowerCase().trim();
    let choice = ALIAS[raw] || raw;

    if (choice !== 'default' && !available.includes(choice)) {
      const f = available.find((d) => d.toLowerCase().includes(choice));
      if (f) choice = f;
    }

    if (choice !== 'default' && !available.includes(choice)) {
      return sock.sendMessage(chatId, {
        text:
          `❌ Unknown skin: *${raw}*\n\n` +
          `Available:\n` +
          available.map((d) => `▸ ${d}`).join('\n') +
          footer,
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
          text: `❌ Global is DEV only.\nUse: \`.setmenu ${choice}\`` + footer,
        });
      }

      pref.default = choice;
      fs.writeFileSync(PREF_FILE, JSON.stringify(pref, null, 2));
      return sock.sendMessage(chatId, {
        text:
          `✅ *GLOBAL* menu → *${choice}*\n` +
          `${prettyName(choice)}\n` +
          `_DEV override_` +
          footer,
      });
    }

    pref[senderId] = choice;
    fs.writeFileSync(PREF_FILE, JSON.stringify(pref, null, 2));

    await sock.sendMessage(chatId, {
      text:
        choice === 'default'
          ? `✅ Menu → *default* (menu.js · banners + audio)` + footer
          : `✅ Menu → *${choice}*\n${prettyName(choice)}\n\nOpen with \`.menu\`` + footer,
    });
  },
};
