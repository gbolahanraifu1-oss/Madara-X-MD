'use strict';

const database = require('../../utils/database');

module.exports = {
    name: 'autoframe',
    aliases: ['setautoframe', 'replyframe', 'autofrm'],
    category: 'system',
    description: 'Turn auto-framing of plain replies on or off',
    usage: '.autoframe on|off',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const phone = ctx.sessionPhone;
        if (!phone) return ctx.reply('❌ Could not resolve this bot session.');

        const prefix = ctx.settings?.prefix || '.';
        const footer = ctx.settings?.FOOTER || '';
        const style = database.getBoxStyle(phone);
        const current = database.getAutoFrame(phone);
        const input = String(args?.[0] || '').trim().toLowerCase();

        if (!input || input === 'show' || input === 'status') {
            return ctx.reply(
                `🖼️ *Auto-frame*\n` +
                `Status: *${current ? 'ON' : 'OFF'}*\n` +
                `Style: *${style}*  (.boxstyle menubox|stylebox)\n\n` +
                `${prefix}autoframe on — wrap *all* plain replies in the selected box style\n` +
                `${prefix}autoframe off — plain replies stay plain (main-branch behaviour)\n\n` +
                `_Commands that import menuBox() always show a card, even when off._` +
                footer
            );
        }

        let enabled;
        if (['on', 'enable', 'enabled', '1', 'true', 'yes'].includes(input)) enabled = true;
        else if (['off', 'disable', 'disabled', '0', 'false', 'no'].includes(input)) enabled = false;
        else {
            return ctx.reply(
                `❌ Usage: ${prefix}autoframe on|off` +
                footer
            );
        }

        database.setAutoFrame(phone, enabled);
        if (enabled) {
            return ctx.reply(
                `✅ Auto-frame *ON*\n` +
                `Plain replies will use *${style}*.\n` +
                `Change style with \`${prefix}boxstyle menubox|stylebox\`.` +
                footer
            );
        }
        return ctx.reply(
            `✅ Auto-frame *OFF*\n` +
            `Plain replies stay plain (like main).\n` +
            `Only commands that call menuBox() will show a frame.` +
            footer
        );
    },
};
