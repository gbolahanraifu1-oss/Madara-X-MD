const { downloadMediaMessage } = require('@itsliaaa/baileys');
const db = require('../../lib/db');
module.exports = {
    name: 'stickeradd',
    aliases: ['savesticker', 'addstkr'],
    category: 'sticker',
    desc: 'Save a sticker to your collection',
    usage: '†stickeradd [name] (reply to sticker)',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const name = ctx.text || `sticker_${Date.now()}`;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!tgt.message?.stickerMessage && !msg.message?.stickerMessage) return ctx.reply(`❌ Reply to a sticker to save it.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf  = await downloadMediaMessage(tgt, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const key  = `stickerlist_${ctx.sender.split('@')[0]}`;
            const lst  = db.get('stickers', key, []);
            lst.push({ name, data: buf.toString('base64'), saved: new Date().toLocaleDateString() });
            db.set('stickers', key, lst);
            ctx.reply(`✅ Sticker *${name}* saved to collection! Total: ${lst.length}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};
