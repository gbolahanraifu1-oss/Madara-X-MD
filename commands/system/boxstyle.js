'use strict';

const database = require('../../utils/database');

module.exports = {
    name: 'boxstyle',
    aliases: ['setboxstyle', 'replybox'],
    category: 'system',
    description: 'Choose the bot reply box design',
    usage: '.boxstyle menubox|stylebox',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const phone = ctx.sessionPhone;
        if (!phone) return ctx.reply('❌ Could not resolve this bot session.');

        const prefix = ctx.settings?.prefix || '.';
        const footer = ctx.settings?.FOOTER || '';
        const current = database.getBoxStyle(phone);
        const input = String(args?.[0] || '').trim().toLowerCase();
        const styles = {
            menu: 'menuBox',
            menubox: 'menuBox',
            'menu-box': 'menuBox',
            style: 'styleBox',
            stylebox: 'styleBox',
            'style-box': 'styleBox',
            default: 'menuBox',
        };
        if (!input || input === 'show' || input === 'list') {
            return ctx.reply(`🧱 *Outgoing box style*\nCurrent: *${current}*\n\n${prefix}boxstyle menubox — MenuBox (default)\n${prefix}boxstyle stylebox — StyleBox\n${prefix}boxstyle default — reset to MenuBox${footer}`);
        }

        const selected = styles[input];
        if (!selected) {
            return ctx.reply(`❌ Choose *menubox* or *stylebox*.\nUsage: ${prefix}boxstyle menubox|stylebox${footer}`);
        }

        database.setBoxStyle(phone, selected);
        return ctx.reply(`✅ Reply box style set to *${selected}*.${footer}`);
    },
};
