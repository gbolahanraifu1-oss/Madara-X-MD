'use strict';
module.exports = {
    name: 'react', aliases: ['emoji', 'reactall'],
    category: 'owner', desc: 'ʀᴇᴀᴄᴛ ᴛᴏ ᴀ ᴍᴇssᴀɢᴇ',
    usage: '†react <emoji>', ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const emoji = args[0];
        if (!emoji) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}react 🔥${s.FOOTER}`);
        const target = msg.message?.extendedTextMessage?.contextInfo?.stanzaId
            ? { remoteJid: ctx.from, id: msg.message.extendedTextMessage.contextInfo.stanzaId, fromMe: false }
            : msg.key;
        await sock.sendMessage(ctx.from, { react: { text: emoji, key: target } });
    }
};
