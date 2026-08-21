'use strict';
const axios = require('axios');
module.exports = {
    name: 'tempmail', aliases: ['throwaway', 'fakemail'],
    category: 'utility', desc: 'ɢᴇɴᴇʀᴀᴛᴇ ᴀ ᴛᴇᴍᴘ ᴇᴍᴀɪʟ',
    usage: '†tempmail',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        try {
            const res = await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1');
            const email = res.data?.[0];
            if (!email) return ctx.reply(`❌ ᴄᴏᴜʟᴅɴ'ᴛ ɢᴇɴᴇʀᴀᴛᴇ ᴇᴍᴀɪʟ.${s.FOOTER}`);
            await ctx.reply(`📧 *ᴛᴇᴍᴘ ᴇᴍᴀɪʟ*\n\n\`${email}\`\n\n_ᴜsᴇ ${s.prefix}checkmail ${email} ᴛᴏ ᴄʜᴇᴄᴋ ɪɴʙᴏx_${s.FOOTER}`);
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};
