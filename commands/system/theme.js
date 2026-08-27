'use strict';

const t = require('../../lib/sessionTheme');
const { toSmallCaps } = require('../../lib/smallcaps');

module.exports = {
    name: 'theme',
    aliases: ['themes', 'settheme'],
    category: 'system',
    desc: 'ᴄʜᴏᴏsᴇ ʏᴏᴜʀ sᴇssɪᴏɴ ᴛʜᴇᴍᴇ',
    usage: '†theme naruto',
    privateOnly: true,
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const a = (args[0] || '').toLowerCase();
        const map = { 1: 'madara', 2: 'naruto', 3: 'akatsuki', 4: 'sharingan', 5: 'itachi' };
        if (!a || a === 'list') return t.themePrompt(ctx);

        const name = map[a] || ((a === 'set' || a === 'change' || a === 'switch') ? args[1] : a);
        const chosen = await t.set(ctx.sessionPhone, name);
        if (!chosen) return ctx.reply('❌ ᴛʜᴇᴍᴇ ɴᴏᴛ ғᴏᴜɴᴅ. ᴜsᴇ †theme ᴛᴏ sᴇᴇ ᴛʜᴇ ᴀᴠᴀɪʟᴀʙʟᴇ ᴛʜᴇᴍᴇs.');
        return ctx.reply(toSmallCaps(
            `✅ *ᴛʜᴇᴍᴇ sᴇᴛ:* ${chosen.STRINGS.global.botName}\n\n` +
            'ᴛʜᴇ ᴛʜᴇᴍᴇ ɪs ɴᴏᴡ ᴀᴄᴛɪᴠᴇ ғᴏʀ ᴛʜɪs sᴇssɪᴏɴ.'
        ));
    },
};