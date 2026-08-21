'use strict';
module.exports = {
    name: 'hidetag', aliases: ['htag', 'silenttag'],
    category: 'group', desc: 'ᴛᴀɢ ᴀʟʟ sɪʟᴇɴᴛʟʏ (ᴛʜᴇʏ ɢᴇᴛ ɴᴏᴛɪғɪᴇᴅ ʙᴜᴛ ɴᴏᴛ ᴠɪsɪʙʟᴇ)',
    usage: '†hidetag [message]', groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const meta = ctx.groupMeta || await sock.groupMetadata(ctx.from).catch(() => null);
        if (!meta) return ctx.reply(`❌ ᴄᴏᴜʟᴅɴ'ᴛ ɢᴇᴛ ɢʀᴏᴜᴘ ɪɴғᴏ.${s.FOOTER}`);
        const members = meta.participants.map(p => p.id);
        const text = args.join(' ') || '📢';
        await sock.sendMessage(ctx.from, { text, mentions: members }, { quoted: msg });
    }
};
