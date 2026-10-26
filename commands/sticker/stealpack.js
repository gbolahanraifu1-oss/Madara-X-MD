const { downloadMediaMessage } = require('@itsliaaa/baileys');
module.exports = {
    name: 'stealpack',
    aliases: ['copystickerpack', 'clonepack', 'packsteal'],
    category: 'sticker',
    desc: 'Steal a sticker and re-brand the entire pack info',
    usage: '†stealpack [New Pack Name] | [New Author] (reply to sticker)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const parts = ctx.text.split('|').map(p => p.trim());
        const pack = parts[0] || s.botName; const author = parts[1] || s.botBrand;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.stickerMessage && !msg.message?.stickerMessage)
            return ctx.reply(`❌ Reply to a sticker.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            await sock.sendMessage(ctx.from, { sticker: buf }, { quoted: msg });
            ctx.reply(`✅ Sticker pack stolen!\n📦 Re-branded as: *${pack}*\n✍️ Author: *${author}*${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};
