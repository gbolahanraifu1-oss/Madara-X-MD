'use strict';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  ECONOMYMENU
// Same story as toolmenu.js/dlmenu.js: advertised as a standalone
// command in .menu's category list, but only ever existed as a static
// example inside menu.js's buildSubMenu() (reachable via `.menu
// economymenu` as an ARGUMENT, not as its own top-level command). The
// real loader category is 'finance', which catmenus.js already exposes
// as .financemenu — this delegates straight into that entry.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
    name: 'economymenu',
    aliases: ['econmenu', 'moneymenu'],
    category: 'system',
    desc: 'sʜᴏᴡ ᴇᴄᴏɴᴏᴍʏ/ғɪɴᴀɴᴄᴇ ᴍᴇɴᴜ',
    usage: '†economymenu',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const catmenus = require('./catmenus');
        const financeMenu = catmenus.find(p => p.name === 'financemenu');
        if (!financeMenu) return ctx.reply(`❌ Economy menu unavailable.${ctx.settings.FOOTER}`);
        return financeMenu.execute(sock, msg, args, ctx);
    }
};
