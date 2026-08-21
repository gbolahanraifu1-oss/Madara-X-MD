'use strict';
const axios = require('axios');
module.exports = {
    name: 'checkmail', aliases: ['inbox', 'readmail'],
    category: 'utility', desc: 'ᴄʜᴇᴄᴋ ᴛᴇᴍᴘ ᴇᴍᴀɪʟ ɪɴʙᴏx',
    usage: '†checkmail <email>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const email = args[0];
        if (!email || !email.includes('@')) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}checkmail user@1secmail.com${s.FOOTER}`);
        const [login, domain] = email.split('@');
        try {
            const res = await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);
            const mails = res.data;
            if (!mails?.length) return ctx.reply(`📭 *ɪɴʙᴏx ᴇᴍᴘᴛʏ* ғᴏʀ \`${email}\`${s.FOOTER}`);
            const list = mails.slice(0, 5).map((m, i) =>
                `*${i+1}.* ғʀᴏᴍ: ${m.from}\n   sᴜʙᴊᴇᴄᴛ: ${m.subject}\n   ᴅᴀᴛᴇ: ${m.date}`
            ).join('\n\n');
            await ctx.reply(`📬 *ɪɴʙᴏx ғᴏʀ* \`${email}\`\n\n${list}${s.FOOTER}`);
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};
