'use strict';

const database = require('../../utils/database');

const DEFAULT_EMOJIS = ['❤️', '🔥', '👍', '😂', '✨', '👑', '💯', '⚡'];

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

function pickAutoReactEmoji(conf) {
    if (!conf || !conf.enabled) return null;
    if (conf.random || !conf.emoji) {
        return DEFAULT_EMOJIS[Math.floor(Math.random() * DEFAULT_EMOJIS.length)];
    }
    return conf.emoji;
}

module.exports = {
    name: 'autoreact',
    aliases: ['ar', 'reactauto'],
    category: 'system',
    desc: 'Auto-react to incoming messages (per session)',
    usage: '.autoreact on [emoji] | .autoreact off | .autoreact status',
    ownerOnly: true,

    DEFAULT_EMOJIS,
    pickAutoReactEmoji,
    resolveSessionPhone,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!ctx.isOwner) {
            return ctx.reply('⛔ Owner only.' + s.FOOTER);
        }

        const pn = resolveSessionPhone(sock, ctx);
        if (!pn) {
            return ctx.reply('❌ Could not resolve this bot session.' + s.FOOTER);
        }

        const sub = String(args[0] || 'status').toLowerCase();
        const current = database.getAutoReact(pn);

        if (sub === 'status') {
            return ctx.reply(
                '*Auto-React* (this session only)\n' +
                'Session: `' + pn + '`\n' +
                'Status: ' + (current.enabled ? '✅ ON' : '❌ OFF') + '\n' +
                'Emoji: ' + (current.random ? 'random pool' : (current.emoji || '❤️')) + '\n\n' +
                '`' + s.prefix + 'autoreact on`\n' +
                '`' + s.prefix + 'autoreact on 🔥`\n' +
                '`' + s.prefix + 'autoreact off`' +
                s.FOOTER
            );
        }

        if (['off', 'disable', '0', 'false'].includes(sub)) {
            database.setAutoReact(pn, { enabled: false });
            return ctx.reply('❌ Auto-react: *OFF* (session `' + pn + '`)' + s.FOOTER);
        }

        if (['on', 'enable', '1', 'true'].includes(sub)) {
            const emojiArg = args[1] ? String(args[1]).trim() : '';
            database.setAutoReact(pn, {
                enabled: true,
                emoji: emojiArg || current.emoji || '❤️',
                random: !emojiArg,
            });
            return ctx.reply(
                '✅ Auto-react: *ON* (session `' + pn + '`)\n' +
                (emojiArg
                    ? 'Emoji: ' + emojiArg
                    : 'Emoji: random ' + DEFAULT_EMOJIS.join(' ')) +
                s.FOOTER
            );
        }

        if (args[0]) {
            const emoji = String(args[0]).trim();
            database.setAutoReact(pn, { enabled: true, emoji, random: false });
            return ctx.reply('✅ Auto-react: *ON* — ' + emoji + ' (session `' + pn + '`)' + s.FOOTER);
        }

        return ctx.reply(
            'Usage:\n' +
            '`' + s.prefix + 'autoreact on`\n' +
            '`' + s.prefix + 'autoreact on 🔥`\n' +
            '`' + s.prefix + 'autoreact off`\n' +
            '`' + s.prefix + 'autoreact status`' +
            s.FOOTER
        );
    },
};