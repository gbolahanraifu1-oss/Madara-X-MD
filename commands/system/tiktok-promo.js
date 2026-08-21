'use strict';
module.exports = {
    name: 'tiktok', aliases: ['tiktokpage', 'shoptt'],
    category: 'system', desc: 'ᴠɪsɪᴛ ᴏᴜʀ ᴛɪᴋᴛᴏᴋ ᴘᴀɢᴇ',
    usage: '†tiktok',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ttLink = process.env.TIKTOK_PAGE || s.tiktokPage || 'https://tiktok.com/@madaraxmd';
        await ctx.reply(
`🎵 *ᴍᴀᴅᴀʀᴀ x-ᴍᴅ ᴛɪᴋᴛᴏᴋ*

🔥 ᴄʜᴇᴄᴋ ᴏᴜᴛ ᴏᴜʀ ᴘᴀɢᴇ ғᴏʀ:
┃ 🎮 ɴᴇᴡ ᴀᴄᴄᴏᴜɴᴛ ᴅʀᴏᴘs
┃ 🎁 ɢɪᴠᴇᴀᴡᴀʏs
┃ 📢 ʟᴀᴛᴇsᴛ ᴜᴘᴅᴀᴛᴇs

🔗 ${ttLink}

_ᴅᴏɴ'ᴛ ᴍɪss ᴀ ᴅʀᴏᴘ — ғᴏʟʟᴏᴡ ᴜs ɴᴏᴡ!_ 🚀${s.FOOTER}`);
    }
};
