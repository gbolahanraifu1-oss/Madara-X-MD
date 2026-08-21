'use strict';
module.exports = {
    name: 'allvars', aliases: ['vars', 'envlist'],
    category: 'owner', desc: 'sʜᴏᴡ ᴀʟʟ ʙᴏᴛ sᴇᴛᴛɪɴɢs',
    usage: '†allvars', ownerOnly: true, devOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!ctx.isDevOwner) return ctx.reply(`⛔ *ᴅᴇᴠ ᴏɴʟʏ.*${s.FOOTER}`);
        const lines = Object.entries(s)
            .filter(([k]) => !['FOOTER','footer'].includes(k) && typeof s[k] !== 'function')
            .map(([k, v]) => `┃ *${k}:* ${String(v).slice(0, 60)}`).join('\n');
        await ctx.reply(`⚙️ *ʙᴏᴛ ᴠᴀʀɪᴀʙʟᴇs*\n\n${lines}${s.FOOTER}`);
    }
};
