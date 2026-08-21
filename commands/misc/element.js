'use strict';
const axios = require('axios');
module.exports = {
    name: 'element', aliases: ['periodic', 'atom'],
    category: 'misc', desc: 'ɢᴇᴛ ᴘᴇʀɪᴏᴅɪᴄ ᴛᴀʙʟᴇ ᴇʟᴇᴍᴇɴᴛ ɪɴғᴏ',
    usage: '†element <name or symbol>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args[0];
        if (!q) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}element gold${s.FOOTER}`);
        try {
            const res = await axios.get(`https://api.api-ninjas.com/v1/periodicTable?name=${encodeURIComponent(q)}`, {
                headers: { 'X-Api-Key': 'aN4y2/kNX1lBPgFdTjQaQg==KBvFc6l9jN9rHEzL' }
            });
            const e = Array.isArray(res.data) ? res.data[0] : res.data;
            if (!e) return ctx.reply(`❌ ᴇʟᴇᴍᴇɴᴛ ɴᴏᴛ ғᴏᴜɴᴅ.${s.FOOTER}`);
            await ctx.reply(
`⚗️ *${e.name} (${e.symbol})*

┃ ᴀᴛᴏᴍɪᴄ ɴᴜᴍʙᴇʀ: *${e.atomic_number}*
┃ ᴀᴛᴏᴍɪᴄ ᴍᴀss: *${e.atomic_mass}*
┃ ᴇʟᴇᴄᴛʀᴏɴ ᴄᴏɴғɪɢ: *${e.electron_configuration}*
┃ ᴘʜᴀsᴇ: *${e.phase}*
┃ ᴍᴇʟᴛɪɴɢ ᴘᴏɪɴᴛ: *${e.melting_point}K*
┃ ʙᴏɪʟɪɴɢ ᴘᴏɪɴᴛ: *${e.boiling_point}K*
┃ ᴄᴀᴛᴇɢᴏʀʏ: *${e.category}*${s.FOOTER}`);
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ ғᴇᴛᴄʜɪɴɢ ᴅᴀᴛᴀ.${s.FOOTER}`); }
    }
};
