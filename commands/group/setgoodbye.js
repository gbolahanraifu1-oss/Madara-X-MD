'use strict';
const { setGroupMessage } = require('../../lib/madaraFeatures');
const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'setgoodbye', aliases: ['goodbyemsg', 'setgoodbyemsg', 'setleave'], category: 'group',
    desc: 'Set the goodbye message template: {name}, {group}, {user}',
    usage: '†setgoodbye Goodbye {name}! We\'ll miss you.',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const settings = ctx.settings;
        const text = ctx.text;
        if (!text) {
            return ctx.reply('❌ Provide a goodbye message.\nVariables: {name}, {group}, {user}\n\nExample:\n' + settings.prefix + 'setgoodbye 👋 Goodbye *{name}*!' + settings.FOOTER);
        }
        if (!setGroupMessage(ctx.sessionPhone, ctx.from, 'goodbye', text)) {
            return ctx.reply('❌ Could not save the goodbye template for this session.' + settings.FOOTER);
        }
        return ctx.reply(menuBox('✅', 'ɢᴏᴏᴅʙʏᴇ ᴍᴇssᴀɢᴇ sᴇᴛ', [
            '_Preview:_',
            text.replace(/{name}/g, 'John').replace(/{group}/g, 'Test Group').replace(/{user}/g, 'John'),
        ]) + settings.FOOTER);
    }
};
