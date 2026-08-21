module.exports = {
    name:      'shutdown',
    aliases:   ['stop', 'off'],
    category:  'system',
    desc:      'Gracefully shut down the bot',
    usage:     '†shutdown',
    ownerOnly: true, devOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!ctx.isDevOwner) {
            return ctx.reply(`⛔ *ᴅᴇᴠ ᴏɴʟʏ.*${s.FOOTER}`);
        }
        await ctx.reply(`⛔ *ʙᴏᴛ sʜᴜᴛᴛɪɴɢ ᴅᴏᴡɴ...*\n_ɢᴏᴏᴅʙʏᴇ!_${s.FOOTER}`);
        setTimeout(() => process.exit(0), 2000);
    }
};
