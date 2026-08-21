'use strict';
module.exports = {
    name: 'afk', aliases: ['away', 'brb'],
    category: 'utility', desc: 'sᴇᴛ ʏᴏᴜʀ ᴀғᴋ sᴛᴀᴛᴜs',
    usage: '†afk [reason]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const reason = args.join(' ') || 'ɴᴏ ʀᴇᴀsᴏɴ';
        if (!global._afkList) global._afkList = new Map();
        global._afkList.set(ctx.sender, { reason, time: Date.now() });
        await ctx.reply(`😴 *ʏᴏᴜ ᴀʀᴇ ɴᴏᴡ ᴀғᴋ*\n\n📝 ʀᴇᴀsᴏɴ: ${reason}${s.FOOTER}`);
    }
};
