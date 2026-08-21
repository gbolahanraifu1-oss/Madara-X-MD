'use strict';
module.exports = {
    name: 'tagadmin', aliases: ['mentionadmin', 'calladmin'],
    category: 'group', desc: 'ᴛᴀɢ ᴀʟʟ ɢʀᴏᴜᴘ ᴀᴅᴍɪɴs',
    usage: '†tagadmin [message]', groupOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const meta = ctx.groupMeta || await sock.groupMetadata(ctx.from).catch(() => null);
        if (!meta) return ctx.reply(`❌ ᴄᴏᴜʟᴅɴ'ᴛ ɢᴇᴛ ɢʀᴏᴜᴘ ɪɴғᴏ.${s.FOOTER}`);
        const admins = meta.participants.filter(p => p.admin).map(p => p.id);
        const text = args.join(' ') || '👮 ᴄᴀʟʟɪɴɢ ᴀᴅᴍɪɴs!';
        const tags = admins.map(j => `@${j.split('@')[0]}`).join(' ');
        await sock.sendMessage(ctx.from, { text: `*${text}*\n\n${tags}`, mentions: admins }, { quoted: msg });
    }
};
