'use strict';
const { downloadMediaMessage } = require('@itsliaaa/baileys');
module.exports = {
    name: 'cmdwithmedia', aliases: ['mediacmd', 'execcmd'],
    category: 'misc', desc: 'ʀᴜɴ ᴀ ᴄᴏᴍᴍᴀɴᴅ ᴡɪᴛʜ ᴛʜᴇ ʀᴇᴘʟɪᴇᴅ ᴍᴇᴅɪᴀ',
    usage: '†cmdwithmedia <cmd> (reply to media)', ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!args.length) return ctx.reply(`❌ sᴘᴇᴄɪғʏ ᴀ ᴄᴏᴍᴍᴀɴᴅ.${s.FOOTER}`);
        const cmdName = args[0];
        const { getCommand } = require('../../lib/loader');
        const plugin = getCommand(cmdName);
        if (!plugin) return ctx.reply(`❌ ᴄᴏᴍᴍᴀɴᴅ *${cmdName}* ɴᴏᴛ ғᴏᴜɴᴅ.${s.FOOTER}`);
        await plugin.execute(sock, msg, args.slice(1), ctx);
    }
};
