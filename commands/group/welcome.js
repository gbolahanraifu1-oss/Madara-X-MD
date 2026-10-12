'use strict';
const { updateGroupFeature } = require('../../lib/madaraFeatures');
const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'welcome', aliases: ['welcometoggle'], category: 'group',
    desc: 'ᴘʀᴇᴍɪᴜᴍ ᴏɴʟʏ ᴛᴏɢɢʟᴇ ᴡᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇs', usage: '†welcome on/off',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const settings = ctx.settings;
        const value = args[0]?.toLowerCase();
        if (!value || !['on', 'off'].includes(value)) {
            return ctx.reply('❌ *ᴜsᴀɢᴇ:* ' + settings.prefix + 'welcome on/off' + settings.FOOTER);
        }

        const result = updateGroupFeature(ctx.sessionPhone, ctx.from, 'welcome', value === 'on', ctx.sender);
        if (!result.ok) {
            if (result.reason === 'premium_required') {
                return ctx.reply('💎 *Premium required.* Welcome is ON by default. Upgrade to Premium to control it.' + settings.FOOTER);
            }
            return ctx.reply('❌ Could not update this session\'s welcome setting.' + settings.FOOTER);
        }

        return ctx.reply(menuBox(value === 'on' ? '✅' : '❌', 'ᴡᴇʟᴄᴏᴍᴇ', [
            'Welcome messages: *' + value.toUpperCase() + '*',
        ]) + settings.FOOTER);
    }
};
