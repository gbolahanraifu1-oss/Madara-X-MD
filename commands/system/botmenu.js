'use strict';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  BOTMENU
// Same story as toolmenu/dlmenu/economymenu.js — advertised in .menu's
// category list but only ever existed as a static example inside
// menu.js's buildSubMenu() (reachable via `.menu botmenu` as an
// ARGUMENT, not its own command). Real loader category is 'system',
// already exposed by catmenus.js as .systemmenu — delegates there.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
    name: 'botmenu',
    aliases: ['botcommands'],
    category: 'system',
    desc: 'sʜᴏᴡ ʙᴏᴛ/sʏsᴛᴇᴍ ᴍᴇɴᴜ',
    usage: '†botmenu',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const catmenus = require('./catmenus');
        const systemMenu = catmenus.find(p => p.name === 'systemmenu');
        if (!systemMenu) return ctx.reply(`❌ Bot menu unavailable.${ctx.settings.FOOTER}`);
        return systemMenu.execute(sock, msg, args, ctx);
    }
};
