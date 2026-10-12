'use strict';
const { setGroupMessage } = require('../../lib/madaraFeatures');
const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'setwelcome', aliases: ['welcomemsg', 'setwelcomemsg'], category: 'group',
    desc: 'Set the welcome message template: {name}, {group}, {count}, {mention}',
    usage: '†setwelcome Welcome {name} to {group}! We now have {count} members.',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const settings = ctx.settings;
        const text = ctx.text;
        if (!text) {
            return ctx.reply('❌ Provide a welcome message.\nVariables: {name}, {group}, {count}, {mention}\n\nExample:\n' + settings.prefix + 'setwelcome 👋 Welcome *{name}* to *{group}*!' + settings.FOOTER);
        }
        if (!setGroupMessage(ctx.sessionPhone, ctx.from, 'welcome', text)) {
            return ctx.reply('❌ Could not save the welcome template for this session.' + settings.FOOTER);
        }
        return ctx.reply(menuBox('✅', 'ᴡᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇ sᴇᴛ', [
            '_Preview:_',
            text.replace(/{name}/g, 'John').replace(/{group}/g, 'Test Group').replace(/{count}/g, '100').replace(/{mention}/g, '@John'),
        ]) + settings.FOOTER);
    }
};
