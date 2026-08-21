'use strict';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  DLMENU
// Friendly-name wrapper — delegates straight into catmenus.js's real
// .mediamenu entry (same reasoning as toolmenu.js). Adds "downloadmenu"
// as the requested full-name alias; doesn't touch 'mediamenu' itself
// since catmenus.js already owns that name.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
    name: 'dlmenu',
    aliases: ['downloadmenu', 'downloadsmenu', 'downloadermenu'],
    category: 'system',
    desc: 'sʜᴏᴡ ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ',
    usage: '†dlmenu',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const catmenus = require('./catmenus');
        const mediaMenu = catmenus.find(p => p.name === 'mediamenu');
        if (!mediaMenu) return ctx.reply(`❌ Download menu unavailable.${ctx.settings.FOOTER}`);
        return mediaMenu.execute(sock, msg, args, ctx);
    }
};
