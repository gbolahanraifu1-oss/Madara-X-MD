'use strict';
module.exports = {
    name: 'antibot', aliases: ['botdetect'],
    category: 'misc', desc: 'ᴛᴏɢɢʟᴇ ᴀɴᴛɪ-ʙᴏᴛ ᴍᴏᴅᴇ',
    usage: '†antibot', groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!global._antibotGroups) global._antibotGroups = new Set();
        if (global._antibotGroups.has(ctx.from)) {
            global._antibotGroups.delete(ctx.from);
            await ctx.reply(`🤖 ᴀɴᴛɪ-ʙᴏᴛ: *ᴏғғ ❌*${s.FOOTER}`);
        } else {
            global._antibotGroups.add(ctx.from);
            await ctx.reply(`🤖 ᴀɴᴛɪ-ʙᴏᴛ: *ᴏɴ ✅*\n_ᴀɴʏ ʙᴏᴛ ᴊᴏɪɴɪɴɢ ᴡɪʟʟ ʙᴇ ᴋɪᴄᴋᴇᴅ._${s.FOOTER}`);
        }
    }
};
