'use strict';
module.exports = {
    // 'tag' removed from here — it collided with tag.js's own primary
    // name, and since this file loads after tag.js alphabetically it was
    // silently winning, meaning .tag was actually running THIS plugin
    // (mention-everyone) instead of tag.js's intended single-target
    // reply logic the whole time.
    name: 'tagall', aliases: ['mentionall', 'everyone'],
    category: 'group', desc: 'ᴛᴀɢ ᴀʟʟ ɢʀᴏᴜᴘ ᴍᴇᴍʙᴇʀs',
    usage: '†tagall [message]', groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const meta = ctx.groupMeta || await sock.groupMetadata(ctx.from).catch(() => null);
        if (!meta) return ctx.reply(`❌ ᴄᴏᴜʟᴅɴ'ᴛ ɢᴇᴛ ɢʀᴏᴜᴘ ɪɴғᴏ.${s.FOOTER}`);
        const members = meta.participants.map(p => p.id);
        const text = args.join(' ') || 'ʜᴇʏ ᴇᴠᴇʀʏᴏɴᴇ!';
        const tags = members.map(j => `@${j.split('@')[0]}`).join(' ');
        await sock.sendMessage(ctx.from, { text: `*${text}*\n\n${tags}`, mentions: members }, { quoted: msg });
    }
};
