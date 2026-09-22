'use strict';

const t = require('../../lib/sessionTheme');
const { toSmallCaps } = require('../../lib/smallcaps');

module.exports = {
    name: 'theme',
    aliases: ['themes', 'settheme'],
    category: 'system',
    desc: 'ᴄʜᴏᴏsᴇ ʏᴏᴜʀ sᴇssɪᴏɴ ᴛʜᴇᴍᴇ',
    usage: '.theme naruto',
    privateOnly: true,
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const a = (args[0] || '').toLowerCase();
        const map = { 1: 'madara', 2: 'naruto', 3: 'akatsuki', 4: 'sharingan', 5: 'itachi' };

        if (!a || a === 'list') {
            // Explicit request — force the prompt to fire even if it
            // already fired once on pair. clearPrompted() removes the
            // persistent gate so themePrompt() will send again.
            const key = ctx.sessionPhone || ctx.sender || '';
            if (t.clearPrompted) t.clearPrompted(key);
            if (t.clearPending)   t.clearPending(key);
            return t.themePrompt(ctx);
        }

        const name = map[a] || ((a === 'set' || a === 'change' || a === 'switch') ? args[1] : a);
        const chosen = await t.set(ctx.sessionPhone, name);
        if (!chosen) return ctx.reply('❌ ᴛʜᴇᴍᴇ ɴᴏᴛ ғᴏᴜɴᴅ. ᴜsᴇ .theme ᴛᴏ sᴇᴇ ᴛʜᴇ ᴀᴠᴀɪʟᴀʙʟᴇ ᴛʜᴇᴍᴇs.');
        return ctx.reply(toSmallCaps(
            `✅ *ᴛʜᴇᴍᴇ sᴇᴛ:* ${chosen.STRINGS.global.botName}\n\n` +
            'ᴛʜᴇ ᴛʜᴇᴍᴇ ɪs ɴᴏᴡ ᴀᴄᴛɪᴠᴇ ғᴏʀ ᴛʜɪs sᴇssɪᴏɴ.'
        ));
    },
};