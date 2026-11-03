'use strict';

const database = require('../../utils/database');

function resolveSessionPhone(sock, ctx) {
    return String(
        ctx?.sessionPhone
        || sock?._sessionPhone
        || sock?.user?.id
        || ''
    )
        .split(':')[0]
        .split('@')[0]
        .replace(/\D/g, '');
}

function digits(jidOrNum) {
    return String(jidOrNum || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

module.exports = {
    name: 'mentionreact',
    aliases: ['mreact', 'mentionreaction'],
    category: 'owner',
    desc: 'Auto-react when someone mentions you (per session)',
    usage: '.mentionreact set <emoji> | .mentionreact off | .mentionreact status',

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!ctx.isOwner && !ctx.isSudo) {
            return ctx.reply('⛔ Owner / sudo only.' + s.FOOTER);
        }

        const sessionPn = resolveSessionPhone(sock, ctx);
        if (!sessionPn) {
            return ctx.reply('❌ Could not resolve this bot session.' + s.FOOTER);
        }

        const senderPn = digits(ctx.sender);
        const userPhone = ctx.isOwner ? sessionPn : senderPn;
        const action = String(args[0] || 'status').toLowerCase();
        const current = database.getMentionReact(sessionPn, userPhone);

        if (!action || action === 'status') {
            return ctx.reply(
                '*Mention React* (session `' + sessionPn + '`)\n' +
                'For: `' + userPhone + '`\n' +
                'Status: ' + (current?.enabled ? '✅ ON — ' + current.emoji : '❌ OFF') + '\n\n' +
                '`' + s.prefix + 'mentionreact set 🔥`\n' +
                '`' + s.prefix + 'mentionreact off`\n' +
                '`' + s.prefix + 'mentionreact status`' +
                s.FOOTER
            );
        }

        if (action === 'off' || action === 'disable') {
            database.setMentionReact(sessionPn, { enabled: false, emoji: current?.emoji || '👀' }, userPhone);
            return ctx.reply('❌ Mention React *OFF* (session `' + sessionPn + '`)' + s.FOOTER);
        }

        if (action === 'set' || action === 'on') {
            const emoji = (args[1] || '').trim();
            if (!emoji) {
                return ctx.reply('Usage: `' + s.prefix + 'mentionreact set 🔥`' + s.FOOTER);
            }
            database.setMentionReact(sessionPn, { enabled: true, emoji }, userPhone);
            return ctx.reply('✅ Mention React *ON* — ' + emoji + ' (session `' + sessionPn + '`)' + s.FOOTER);
        }

        const emoji = String(args[0] || '').trim();
        if (emoji) {
            database.setMentionReact(sessionPn, { enabled: true, emoji }, userPhone);
            return ctx.reply('✅ Mention React *ON* — ' + emoji + ' (session `' + sessionPn + '`)' + s.FOOTER);
        }

        return ctx.reply('Usage: `' + s.prefix + 'mentionreact set <emoji>` | `off` | `status`' + s.FOOTER);
    },
};