const { downloadMediaMessage } = require('@itsliaaa/baileys');
module.exports = {
    name: 'icon',
    aliases: ['setgroupicon', 'setgpp', 'grouppp'],
    category: 'group',
    desc: 'Update group profile picture (reply to image)',
    usage: '†icon (reply to image)',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!tgt.message?.imageMessage && !msg.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(tgt, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            await sock.updateProfilePicture(ctx.from, buf);
            ctx.reply(`✅ *Group icon updated!*${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};
