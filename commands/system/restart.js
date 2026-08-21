module.exports = {
    name:      'restart',
    aliases:   ['reboot'],
    category:  'system',
    desc:      'Restart the bot',
    usage:     '†restart',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!ctx.isDevOwner) {
            return ctx.reply(`⛔ *ᴅᴇᴠ ᴏɴʟʏ.*${s.FOOTER}`);
        }
        await ctx.reply(`🔄 *ʀᴇsᴛᴀʀᴛɪɴɢ ʙᴏᴛ...*${s.FOOTER}`);
        setTimeout(() => process.exit(0), 1500);
    }
};
