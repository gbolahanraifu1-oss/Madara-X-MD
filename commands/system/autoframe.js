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

        if (typeof database.getAutoFrame !== 'function' || typeof database.setAutoFrame !== 'function') {
            return ctx.reply(
                '❌ *getAutoFrame/setAutoFrame missing* from `utils/database.js`.\n' +
                'Add the autoframe methods to **utils/database.js** (not lib/database.js) and restart.'
            );
        }

        const prefix = ctx.settings?.prefix || '.';
        const footer = ctx.settings?.FOOTER || '';
        const style = database.getBoxStyle(phone);
        const current = database.getAutoFrame(phone);
        const input = String(args?.[0] || '').trim().toLowerCase();

        if (!input || input === 'show' || input === 'status') {
            return ctx.reply(
                `🖼️ *Auto-frame*\n` +
                `Status: *${current ? 'ON' : 'OFF'}*\n` +
                `Style: *${style}*  (.boxstyle menubox|stylebox)\n` +
                `Session: \`${phone}\`\n\n` +
                `${prefix}autoframe on — wrap *all* plain replies\n` +
                `${prefix}autoframe off — plain replies stay plain\n\n` +
                `_Commands that call menuBox() always show a card._` +
                footer
            );
        }

        let enabled;
        if (['on', 'enable', 'enabled', '1', 'true', 'yes'].includes(input)) enabled = true;
        else if (['off', 'disable', 'disabled', '0', 'false', 'no'].includes(input)) enabled = false;
        else {
            return ctx.reply(`❌ Usage: ${prefix}autoframe on|off${footer}`);
        }

        database.setAutoFrame(phone, enabled);
        const readBack = database.getAutoFrame(phone);
        const styleNow = database.getBoxStyle(phone);

        if (enabled && !readBack) {
            return ctx.reply(
                `⚠️ Tried to enable auto-frame but read-back is still OFF.\n` +
                `Session phone: \`${phone}\`\n` +
                `Check that methods are on **utils/database.js** and data/users is writable.` +
                footer
            );
        }

        if (enabled) {
            return ctx.reply(
                `✅ Auto-frame *ON* (read-back: ${readBack ? 'ON' : 'OFF'})\n` +
                `Style: *${styleNow}*\n` +
                `Session: \`${phone}\`\n` +
                `Plain replies will now be wrapped.` +
                footer
            );
        }
        return ctx.reply(
            `✅ Auto-frame *OFF*\n` +
            `Plain replies stay plain.\n` +
            `Only commands that call menuBox() show a frame.` +
            footer
        );
    },
};
