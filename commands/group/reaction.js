module.exports = {
    name: 'reaction',
    aliases: ['react', 'emoji'],
    category: 'group',
    desc: 'React to a replied message with an emoji',
    usage: '†reaction [emoji] (reply to message)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const emoji = args[0];
        if (!emoji) return ctx.reply(`❌ Provide an emoji.\n_Example: ${s.prefix}reaction 🔥 (reply to a message)_${s.FOOTER}`);
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        if (!ctxInfo?.stanzaId) return ctx.reply(`❌ Reply to a message to react to it.${s.FOOTER}`);
        await sock.sendMessage(ctx.from, {
            react: {
                text: emoji,
                key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }
            }
        });
    }
};
