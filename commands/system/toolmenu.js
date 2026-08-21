'use strict';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  TOOLMENU
// Friendly-name wrapper — the real category menu system lives in
// commands/system/catmenus.js (which already builds .utilitymenu with
// the correct menuBox() layout, dynamically from the loader's real
// 'utility' category). This just delegates straight into that entry so
// .toolmenu always renders identically to .utilitymenu, no duplicate
// rendering logic to drift out of sync.
// NOTE: does NOT alias 'utilitymenu' — catmenus.js already owns that
// name; claiming it here would silently steal it depending on file
// load order (same trap that broke .allmenu earlier).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
    name: 'toolmenu',
    aliases: ['tools', 'utils'],
    category: 'system',
    desc: 'sʜᴏᴡ ᴜᴛɪʟɪᴛʏ ᴍᴇɴᴜ',
    usage: '†toolmenu',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const catmenus = require('./catmenus');
        const utilityMenu = catmenus.find(p => p.name === 'utilitymenu');
        if (!utilityMenu) return ctx.reply(`❌ Utility menu unavailable.${ctx.settings.FOOTER}`);
        return utilityMenu.execute(sock, msg, args, ctx);
    }
};
