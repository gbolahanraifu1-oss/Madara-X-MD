'use strict';
const fs   = require('fs');
const path = require('path');
module.exports = {
    name: 'getfile', aliases: ['readfile', 'catfile'],
    category: 'owner', desc: 'ɢᴇᴛ ᴄᴏɴᴛᴇɴᴛs ᴏғ ᴀ ғɪʟᴇ',
    usage: '†getfile <path>', ownerOnly: true, devOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!ctx.isDevOwner) return ctx.reply(`⛔ *ᴅᴇᴠ ᴏɴʟʏ.*${s.FOOTER}`);
        const fp = args.join(' ');
        if (!fp) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}getfile ./settings.js${s.FOOTER}`);
        try {
            const content = fs.readFileSync(fp, 'utf8');
            await ctx.reply(`\`\`\`${content.slice(0, 3000)}\`\`\`${s.FOOTER}`);
        } catch (e) { await ctx.reply(`❌ ${e.message}${s.FOOTER}`); }
    }
};
