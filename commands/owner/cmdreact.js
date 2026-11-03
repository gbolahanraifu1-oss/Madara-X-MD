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

module.exports = {
    name: 'cmdreact',
    aliases: ['commandreact', 'cmdreaction'],
    category: 'owner',
    desc: 'React when running commands (per session)',
    usage: '.cmdreact on|off|status',
    ownerOnly: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!ctx.isOwner) {
            return ctx.reply('⛔ Owner only.' + s.FOOTER);
        }

        const pn = resolveSessionPhone(sock, ctx);
        if (!pn) {
            return ctx.reply('❌ Could not resolve this bot session.' + s.FOOTER);
        }

        const option = String(args[0] || 'status').toLowerCase();

        if (option === 'status') {
            return ctx.reply(
                '*Command Reactions* (session `' + pn + '`)\n' +
                'Status: ' + (database.getCmdReact(pn) ? '✅ ON' : '❌ OFF') + '\n' +
                'Use `' + s.prefix + 'cmdreact on|off`.' +
                s.FOOTER
            );
        }

        if (['on', 'enable', '1', 'true'].includes(option)) {
            database.setCmdReact(pn, true);
            return ctx.reply('✅ Command reactions *ON* (session `' + pn + '`)' + s.FOOTER);
        }

        if (['off', 'disable', '0', 'false'].includes(option)) {
            database.setCmdReact(pn, false);
            return ctx.reply('❌ Command reactions *OFF* (session `' + pn + '`)' + s.FOOTER);
        }

        return ctx.reply('Usage: `' + s.prefix + 'cmdreact on|off|status`' + s.FOOTER);
    },
};