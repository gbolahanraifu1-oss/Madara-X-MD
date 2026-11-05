'use strict';

const database = require('../../utils/database');

module.exports = {
    name: 'boxstyle',
    aliases: ['setboxstyle', 'replybox'],
    category: 'system',
    description: 'Choose which frame is used when auto-frame is ON',
    usage: '.boxstyle menubox|stylebox',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const phone = ctx.sessionPhone;
        if (!phone) return ctx.reply('❌ Could not resolve this bot session.');

        const prefix = ctx.settings?.prefix || '.';
        const footer = ctx.settings?.FOOTER || '';
        const current = database.getBoxStyle(phone);
        const auto = database.getAutoFrame(phone) ? 'ON' : 'OFF';
        const input = String(args?.[0] || '').trim().toLowerCase();

        if (!input || input === 'show' || input === 'list') {
            return ctx.reply(
                `🧱 *Box style*\n` +
                `Current style: *${current}*\n` +
                `Auto-frame: *${auto}*  (.autoframe on|off)\n\n` +
                `${prefix}boxstyle menubox — MenuBox frame\n` +
                `${prefix}boxstyle stylebox — StyleBox frame\n\n` +
                `_This only applies when auto-frame is ON, or inside commands that call menuBox()._` +
                footer
            );
        }

        const selected = database.setBoxStyle(phone, input);
        if (!selected) {
            return ctx.reply(
                `❌ Choose *menubox* or *stylebox*.\n` +
                `Usage: ${prefix}boxstyle menubox|stylebox` +
                footer
            );
        }

        return ctx.reply(
            `✅ Box style set to *${selected}*.\n` +
            `Auto-frame is *${auto}* — use \`${prefix}autoframe on\` to wrap plain replies.` +
            footer
        );
    },
};
