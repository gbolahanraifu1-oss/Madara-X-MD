const { menuBox } = require('../../lib/menuBox');
module.exports = { name: 'jokecategory', aliases: ['jokecat','listjokes'], category: 'fun', desc: 'List joke categories', usage: '†jokecategory',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        ctx.reply(menuBox('😂', 'ᴊᴏᴋᴇ ᴄᴀᴛᴇɢᴏʀɪᴇs', [
            'Programming', 'Pun', 'Dark', 'Spooky', 'Misc',
            `Usage: \`${s.prefix}joke [category]\``,
        ]) + s.FOOTER);
    }
};
