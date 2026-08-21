const { menuBox } = require('../../lib/menuBox');
module.exports = { name: 'memecategory', aliases: ['memecat','listmemes'], category: 'fun', desc: 'List meme categories', usage: '†memecategory',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        ctx.reply(menuBox('😂', 'ᴍᴇᴍᴇ ᴄᴀᴛᴇɢᴏʀɪᴇs', [
            'dankmemes', 'memes', 'programmerhumor', 'funny', 'wholesomememes',
            `Usage: \`${s.prefix}meme [category]\``,
        ]) + s.FOOTER);
    }
};
