const { downloadMediaMessage } = require('@itsliaaa/baileys');
module.exports = {
    name: 'broadcast',
    aliases: ['bc', 'broadcastall'],
    category: 'utility',
    desc: 'Broadcast message to all groups bot is in',
    usage: '†broadcast [message] or reply to media',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        let groups = [];
        try {
            const chats = await sock.groupFetchAllParticipating();
            groups = Object.keys(chats);
        } catch (e) { return ctx.reply(`❌ Failed to fetch groups: ${e.message}${s.FOOTER}`); }
        if (!groups.length) return ctx.reply(`❌ Bot is not in any groups.${s.FOOTER}`);

        const qCtx    = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg  = msg.message?.imageMessage || qCtx?.imageMessage;
        const vidMsg  = msg.message?.videoMessage || qCtx?.videoMessage;
        const hasMedia = imgMsg || vidMsg;
        const text    = ctx.text;
        if (!text && !hasMedia) return ctx.reply(`❌ Provide a message or reply to media.\n_Usage: ${s.prefix}broadcast Hello everyone!_${s.FOOTER}`);

        await ctx.reply(`📡 *Broadcasting to ${groups.length} groups...*${s.FOOTER}`);

        let mediaBuffer = null, mediaType = null;
        if (hasMedia) {
            try {
                const tgt = msg.message?.imageMessage ? msg : { message: qCtx };
                mediaBuffer = await downloadMediaMessage(tgt, 'buffer', {});
                mediaType   = imgMsg ? 'image' : 'video';
            } catch {}
        }

        let sent = 0, failed = 0;
        const delay = ms => new Promise(r => setTimeout(r, ms));
        for (const gid of groups) {
            try {
                if (mediaBuffer && mediaType === 'image') await sock.sendMessage(gid, { image: mediaBuffer, caption: text || s.FOOTER });
                else if (mediaBuffer && mediaType === 'video') await sock.sendMessage(gid, { video: mediaBuffer, caption: text || s.FOOTER });
                else await sock.sendMessage(gid, { text: `${text}${s.FOOTER}` });
                sent++;
            } catch { failed++; }
            await delay(800);
        }
        ctx.reply(`✅ *Broadcast Complete*\n\n*Sent:* ${sent}\n*Failed:* ${failed}\n*Total:* ${groups.length}${s.FOOTER}`);
    }
};
