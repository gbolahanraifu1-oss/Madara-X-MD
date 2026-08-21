'use strict';
module.exports = {
    name: 'alwaysonline', aliases: ['ao', 'onlinemode'],
    category: 'misc', desc: 'ᴛᴏɢɢʟᴇ ᴀʟᴡᴀʏs-ᴏɴʟɪɴᴇ ᴍᴏᴅᴇ',
    usage: '†alwaysonline', ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!global._aoInterval) {
            global._aoInterval = setInterval(() => {
                sock.sendPresenceUpdate('available').catch(() => {});
            }, 10000);
            await ctx.reply(`✅ ᴀʟᴡᴀʏs-ᴏɴʟɪɴᴇ: *ᴏɴ*${s.FOOTER}`);
        } else {
            clearInterval(global._aoInterval);
            global._aoInterval = null;
            await sock.sendPresenceUpdate('unavailable').catch(() => {});
            await ctx.reply(`❌ ᴀʟᴡᴀʏs-ᴏɴʟɪɴᴇ: *ᴏғғ*${s.FOOTER}`);
        }
    }
};
