'use strict';
const { updateGroupFeature, getGroupMessage, setGroupMessage } = require('../../lib/madaraFeatures');
const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'goodbye', aliases: ['bye', 'leave'], category: 'group',
    desc: 'Toggle goodbye messages (Premium)', usage: '†goodbye on | off | [custom message]',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const settings = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        if (['on', 'off'].includes(sub) && args.length === 1) {
            const enabled = sub === 'on';
            const result = updateGroupFeature(ctx.sessionPhone, ctx.from, 'goodbye', enabled, ctx.sender);
            if (!result.ok) {
                if (result.reason === 'premium_required') {
                    return ctx.reply('💎 *Premium required.* Goodbye is ON by default. Upgrade to Premium to control it.' + settings.FOOTER);
                }
                return ctx.reply('❌ Could not update this session\'s goodbye setting.' + settings.FOOTER);
            }
            const current = getGroupMessage(ctx.sessionPhone, ctx.from, 'goodbye', 'Goodbye @{user}! Thanks for being with us 👋');
            return ctx.reply(menuBox(enabled ? '✅' : '❌', 'ɢᴏᴏᴅʏᴇ: ' + sub.toUpperCase(), [
                'Goodbye messages ' + (enabled ? 'enabled.' : 'disabled.'),
                '*Current template:* ' + current,
            ]) + settings.FOOTER);
        }

        const text = ctx.text || 'Goodbye {user}! Thanks for being with us 👋';
        if (!setGroupMessage(ctx.sessionPhone, ctx.from, 'goodbye', text)) {
            return ctx.reply('❌ Could not save the goodbye template for this session.' + settings.FOOTER);
        }
        return ctx.reply(menuBox('✅', 'ɢᴏᴏᴅʏᴇ ᴍᴇssᴀɢᴇ sᴇᴛ', [
            text,
            '_Use {user} for member name._',
            '_Use ' + settings.prefix + 'goodbye on/off to control delivery (Premium)._',
        ]) + settings.FOOTER);
    }
};
